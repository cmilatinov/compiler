import { Map } from 'immutable';

import { ASTNode, ASTValidatorBase, EventCallback, defaultWarning, defaultError } from '../lib/ast-validator';
import { SymbolTable, SymbolTableEntry } from '../lib/symbol-table';
import { SourceLocation } from '../lib/tokenizer';

import * as ASTUtils from '../ast/utils';
import * as Utils from './utils';

export class DefaultValidator extends ASTValidatorBase {

    private readonly _globalTable: SymbolTable;

    private _currentTable: SymbolTable;
    private _isImpl: boolean;
    private _lastLocation: SourceLocation;

    constructor(warning: EventCallback = defaultWarning, error: EventCallback = defaultError) {
        super(warning, error);
        this._globalTable = this._currentTable = new SymbolTable();
        this._isImpl = false;
        this._lastLocation = null;
    }

    protected getChildren(node: ASTNode): ASTNode[] {
        return ASTUtils.getNodeChildren(node);
    }

    protected visit(node: ASTNode): boolean {
        this._lastLocation = node.location || this._lastLocation;
        switch (node.type) {
            case 'FunctionDefinition':
                return this.visitFunctionDefinition(node);
            case 'FunctionDeclaration':
                return this.visitFunctionDeclaration(node);
            case 'StructDeclaration':
                return this.visitStructDeclaration(node);
            case 'ImplDeclaration':
                return this.visitImplDeclaration(node);
            case 'VariableDeclaration':
                return this.visitVariableDeclaration(node);
            case 'ExpressionStatement':
                return this.visitExpressionStatement(node);
            case 'IfStatement':
            case 'WhileStatement':
                return this.visitConditionalStatement(node);
            case 'ReadStatement':
                return this.visitReadStatement(node);
            case 'WriteStatement':
                return this.visitWriteStatement(node);
            case 'ReturnStatement':
                return this.visitReturnStatement(node);
        }
        return true;
    }

    protected postVisit(node: ASTNode) {
        // noinspection FallThroughInSwitchStatementJS
        switch (node.type) {
            case 'ImplDeclaration': {
                this._isImpl = false;
            }
            case 'FunctionDefinition':
            case 'FunctionDeclaration':
            case 'StructDeclaration': {
                this._currentTable = this._currentTable?.getParentTable() || this._globalTable;
                break;
            }
            case 'Program':
                let unimplementedFunctions = [];
                let unusedIdentifiers = [];
                this._globalTable.traverseEntries(entry => {
                    if (entry.type === 'function' && !entry.implemented)
                        unimplementedFunctions.push(entry);
                    if (entry.references === 0 && (entry.type !== 'function' || entry.name !== 'main' || entry.parameters.length !== 0))
                        unusedIdentifiers.push(entry);
                });

                // Print warnings for unused variables
                unusedIdentifiers.forEach(id => this.warning(`Unused ${Utils.formatType(id.type)} '${id.name}'.`));

                // Print errors for unimplemented member functions
                if (unimplementedFunctions.length > 0) {
                    unimplementedFunctions.forEach(fn => this.error(`Unimplemented member function '${Utils.stringifyFunction(fn)}'.`));
                    return false;
                }
                break;
        }
        return true;
    }

    // noinspection DuplicatedCode
    private visitFunctionDefinition(node: ASTNode) {
        // Member function
        if (this._isImpl) {
            // Check declared member function with same signature
            const existingFunctions = this._currentTable.lookupMultiple(node.name);
            const existingFunction = existingFunctions.find(f => Utils.functionFullEquals(node, f));
            if (!existingFunction) {
                this.error(`Definition provided for undeclared member function '${Utils.stringifyFunction(node)}'.`);
                return false;
            }

            // Set implemented and current symbol table
            existingFunction.implemented = true;
            this._currentTable = existingFunction.symbolTable;

        // Free function
        } else {
            // Check existing free functions with same name
            const existingFunctions = this._currentTable.lookupMultiple(node.name);
            if (existingFunctions.length > 0) {
                if (existingFunctions.some(f => Utils.functionEquals(node, f))) {
                    this.error(`Multiply declared free function '${Utils.stringifyFunction(node)}'.`);
                    return false;
                }
                this.warning(`Overloaded free function '${Utils.stringifyFunction(node)}'.`);
            }

            // Check return type
            if (!this.isValidReturnType(node.returnType)) {
                this.error(`Undeclared return type '${node.returnType}'.`);
                return false;
            }

            // Create new symbol table and insert entry
            const symbolTable = new SymbolTable(node.name, this._currentTable);
            this._currentTable.insert({
                type: 'function',
                name: node.name,
                parentTable: this._currentTable,
                references: 0,
                implemented: true,
                parameters: node.parameters,
                returnType: node.returnType,
                symbolTable
            }, true);

            // Add function parameters to symbol table
            this._currentTable = symbolTable;
            this.visitParameters(node.parameters);
        }
        return true;
    }

    private visitFunctionDeclaration(node: ASTNode) {
        // Check existing member functions & data members
        const existingEntries = this._currentTable.lookupMultiple(node.name);
        if (existingEntries.length > 0) {
            // Check for data member with same name
            const existingData = existingEntries.find(f => f.type === 'data');
            if (existingData) {
                this.error(`Function declaration '${Utils.stringifyFunction(node)}' ` +
                    `clashes with existing data member '${existingData.name}'.`);
                return false;
            }

            // Check for function with same name and signature
            if (existingEntries.some(f => Utils.functionEquals(node, f))) {
                this.error(`Multiply declared member function '${Utils.stringifyFunction(node)}'.`);
                return false;
            }

            // Overload warning
            this.warning(`Overloaded member function '${Utils.stringifyFunction(node)}'.`);
        }

        // Check return type
        if (!this.isValidReturnType(node.returnType)) {
            this.error(`Undeclared return type '${node.returnType}'.`);
            return false;
        }

        // Check for overridden function declared in base class
        const overriddenFunc = this.lookupShadowedFunctionMembers(node.name, this.getCurrentClassEntry());
        if (overriddenFunc.length > 0) {
            overriddenFunc[0].references++;
            const baseClass = this.getCurrentClassEntry(overriddenFunc[0].symbolTable);
            this.warning(`Member function overrides '${Utils.stringifyFunction(node)}' declared in base class '${baseClass.name}'.`);
        }

        // Shadowed data members
        const shadowedEntries = node.parameters.reduce((acc, p) => [...acc, ...this.lookupShadowedDataMembers(p.name, this._currentTable.getParentEntry())], []);
        shadowedEntries.filter(e => e.parentTable == this._currentTable || e.visibility === 'public')
            .forEach(e => this.warning(`Shadowed data member '${e.name}'.`));

        // Insert new entry and create new symbol table
        const symbolTable = new SymbolTable(node.name, this._currentTable);
        this._currentTable.insert({
            type: 'function',
            name: node.name,
            parentTable: this._currentTable,
            references: 0,
            visibility: node.visibility,
            implemented: false,
            parameters: node.parameters,
            returnType: node.returnType,
            symbolTable
        }, true);

        // Add function parameters to symbol table
        this._currentTable = symbolTable;
        this.visitParameters(node.parameters);

        return true;
    }

    private visitStructDeclaration(node: ASTNode) {
        // Check inheritance list
        const validInheritanceList = this.visitInheritanceList(node);
        if (!validInheritanceList)
            return false;

        // Insert entry in symbol table
        const symbolTable = new SymbolTable(node.name, this._currentTable);
        if (!this._currentTable.insert({
            type: 'class',
            name: node.name,
            parentTable: this._currentTable,
            references: 0,
            inheritanceList: node.inheritanceList,
            symbolTable
        })) {
            this.error(`Multiply declared class '${node.name}'.`);
            return false;
        }

        // Set new symbol table
        this._currentTable = symbolTable;
        return true;
    }

    private visitImplDeclaration(node: ASTNode) {
        const entry = this._currentTable.lookup(node.name);
        if (entry?.type !== 'class') {
            this.error(`Implementation provided for undeclared class '${node.name}'.`);
            return false;
        }
        this._currentTable = entry.symbolTable;
        this._isImpl = true;
        return true;
    }

    private visitVariableDeclaration(node: ASTNode) {
        const parentEntry = this._currentTable.getParentEntry();
        if (!parentEntry) {
            this.error(`Illegal variable declaration '${node.name}'.`);
            return false;
        }

        // Check variable type
        if (node.varType !== 'float' && node.varType !== 'integer') {
            const typeEntry = this._currentTable.lookup(node.varType);
            if (!typeEntry) {
                this.error(`Variable declaration '${node.name}' has undeclared type '${node.varType}'.`);
                return false;
            }

            if (typeEntry.type !== 'class') {
                this.error(`Variable declaration '${node.name}' must have a class type, instead found ${typeEntry.type} '${typeEntry.name}'.`);
                return false;
            }

            typeEntry.references++;
        }

        switch (parentEntry.type) {
            case 'class': {
                // Insert new entry in table
                if (!this._currentTable.insert({
                    type: 'data',
                    name: node.name,
                    parentTable: this._currentTable,
                    references: 0,
                    varType: node.varType,
                    arraySizes: node.arraySizes,
                    visibility: node.visibility
                })) {
                    const entry = this._currentTable.lookup(node.name);
                    if (entry.type === 'data')
                        this.error(`Multiply declared data member '${node.name}'.`);
                    else
                        this.error(`Multiply declared identifier '${node.name}'.`);
                    return false;
                }

                // Shadowed data members
                const shadowedEntries = this.lookupShadowedDataMembers(node.name, this._currentTable.getParentEntry())
                    .filter(e => e.parentTable !== this._currentTable);
                shadowedEntries.forEach(e => this.warning(`Shadowed data member '${e.name}'.`));
                break;
            }
            case 'function': {
                if (!this._currentTable.insert({
                    type: 'local',
                    name: node.name,
                    parentTable: this._currentTable,
                    references: 0,
                    varType: node.varType,
                    arraySizes: node.arraySizes
                })) {
                    const entry = this.identifierLookup(node.name);
                    if (entry.type === 'local')
                        this.error(`Multiply declared local variable '${node.name}'.`);
                    else
                        this.error(`Multiply declared identifier '${node.name}'.`);
                    return false;
                }

                // Shadowed data members
                const parentClass = this.getCurrentClassEntry();
                if (parentClass) {
                    const shadowedEntries = this.lookupShadowedDataMembers(node.name, parentClass)
                        .filter(e => e.parentTable === this._currentTable.getParentTable());
                    shadowedEntries.forEach(e => this.warning(`Shadowed data member '${e.name}'.`));
                }
                break;
            }
        }
        return true;
    }

    private visitNestedIdentifierExpression(node: ASTNode) {
        let typeEntry = undefined;
        let result;
        let lastIsMemberIndex = false;
        do {

            // Process node expression
            switch (node.type) {
                case 'IdentifierExpression': {
                    lastIsMemberIndex = false;
                    result = this.visitIdentifierExpression(node, typeEntry);
                    if (!result)
                        return false;
                    break;
                }
                case 'FunctionCallExpression': {
                    lastIsMemberIndex = false;
                    result = this.visitFunctionCallExpression(node, typeEntry);
                    if (!result)
                        return false;
                    break;
                }
                case 'MemberIndexExpression': {
                    lastIsMemberIndex = true;
                    result = this.visitMemberIndexExpression(node, typeEntry);
                    if (!result)
                        return false;
                    break;
                }
            }

            // Attempt to find type entry
            typeEntry = this._currentTable.lookup(result.varType || result.returnType);

            // Check that we do have a type entry if expression is chained
            // Otherwise we are illegally chaining on an expression of a primitive type
            if (node.chainedExpression && !typeEntry) {
                this.error(`Illegal accessor on expression of primitive type.`);
                return false;
            }

            // Go to chained expression
            node = node.chainedExpression;

        } while(node);

        return {
            varType: result.varType || result.returnType,
            arraySizes: lastIsMemberIndex ? [] : (result.arraySizes || [])
        };
    }

    private visitIdentifierExpression(node: ASTNode, previousTypeEntry?: SymbolTableEntry) {
        let varEntry;
        if (previousTypeEntry) {
            // Check identifier references existing data member
            varEntry = this.lookupShadowedDataMembers(node.identifier, previousTypeEntry)[0];
            if (varEntry?.type !== 'data') {
                this.error(`Member variable '${node.identifier}' is not defined on type '${previousTypeEntry.name}'.`);
                return false;
            }

            // Check var is accessible
            if (varEntry.visibility === 'private') {
                const currentClass = this.getCurrentClassEntry();
                if (!this.inheritsFrom(currentClass, previousTypeEntry)) {
                    this.error(`Member variable '${node.identifier}' is inaccessible from the current scope.`);
                    return false;
                }
            }
        } else {
            // Check identifier references existing variable or data member
            varEntry = this.getVariableEntry(node.identifier);
            if (!varEntry)
                return false;
        }

        // Increment references
        varEntry.references++;
        return varEntry;
    }

    private visitFunctionCallExpression(node: ASTNode, previousTypeEntry?: SymbolTableEntry) {
        let funcEntries;
        if (previousTypeEntry) {
            // Check function exists on type
            funcEntries = this.lookupShadowedFunctionMembers(node.identifier, previousTypeEntry);
            if (funcEntries.length <= 0) {
                this.error(`Member function '${node.identifier}' is not ` +
                    `defined on type '${previousTypeEntry.name}'.`);
                return false;
            }
        } else {
            // Check function exists
            funcEntries = this._currentTable.lookupMultiple(node.identifier, true)
                .filter(e => e.type === 'function');
            if (funcEntries.length <= 0) {
                this.error(`Reference to undeclared function '${node.identifier}'.`);
                return false;
            }
        }

        // Check number of arguments
        funcEntries = funcEntries.filter(e => e.parameters.length === node.arguments.length);
        if (funcEntries.length <= 0) {
            this.error(`Function '${node.identifier}' called with wrong number number of arguments.`);
            return false;
        }

        // Get argument expression types
        const argumentTypes = node.arguments.map(e => this.getExpressionType(e));
        if (argumentTypes.some(t => !t)) {
            this.error(`Type error in function call '${node.identifier}'.`);
            return false;
        }

        // Check argument types
        const funcEntry = funcEntries.find(e => e.parameters.every((p, i) => Utils.typeEquals(argumentTypes[i], p)));
        if (!funcEntry) {
            this.error(`Function '${node.identifier}' called with wrong argument types.`);
            return false;
        }

        // Check function is accessible
        if (previousTypeEntry && funcEntry.visibility === 'private') {
            const currentClass = this.getCurrentClassEntry();
            if (!this.inheritsFrom(currentClass, previousTypeEntry)) {
                this.error(`Member function '${Utils.stringifyFunction(funcEntry)}' is inaccessible from the current scope.`);
                return false;
            }
        }

        // Increment references
        funcEntry.references++;
        return funcEntry;
    }

    private visitMemberIndexExpression(node: ASTNode, previousTypeEntry?: SymbolTableEntry) {
        let varEntry;
        if (previousTypeEntry) {
            // Check identifier in type exists
            varEntry = this.identifierLookup(node.identifier, previousTypeEntry.symbolTable);
            if (varEntry?.type !== 'data') {
                this.error(`Member property '${node.identifier}' is not ` +
                    `defined on type '${previousTypeEntry.name}'.`);
                return false;
            }

            // Check var is accessible
            if (varEntry.visibility === 'private') {
                const currentClass = this.getCurrentClassEntry();
                if (!this.inheritsFrom(currentClass, previousTypeEntry)) {
                    this.error(`Member variable '${node.identifier}' is inaccessible from current scope.`);
                    return false;
                }
            }
        } else {
            // Check identifier references existing variable or data member
            varEntry = this.getVariableEntry(node.identifier);
            if (!varEntry)
                return false;
        }

        // Check array dimensions match
        if (node.indices.length !== varEntry.arraySizes.length) {
            this.error(`Variable '${node.identifier}' indexed with ${node.indices.length} dimension(s) ` +
                `instead of ${varEntry.arraySizes.length}.`);
            return false;
        }

        // Check every index has integer expression type
        if (!node.indices.every(index => this.visitIndex(index))) {
            return false;
        }

        // Increment references
        varEntry.references++;
        return varEntry;
    }

    private visitIndex(node: ASTNode) {
        const integerType = { varType: 'integer', arraySizes: [] };

        const indexType = this.getExpressionType(node.expression);
        if (!indexType) {
            this.error(`Index expression type must evaluate to '${Utils.stringifyType(integerType)}'.`);
            return false;
        }

        if (!Utils.typeEquals(this.getExpressionType(node.expression), integerType)) {
            this.error(`Index expression type must evaluate to ` +
                `'${Utils.stringifyType(integerType)}', instead got '${Utils.stringifyType(indexType)}'.`);
            return false;
        }

        return true;
    }

    private visitExpressionStatement(node: ASTNode) {
        // Assignment expression
        if (node.expression.type === 'AssignmentExpression') {

            // Check type errors
            const leftType = this.getExpressionType(node.expression.left);
            const rightType = this.getExpressionType(node.expression.right);
            if (!leftType || !rightType) {
                return false;
            }

            // Check left expression is lvalue
            if (!Utils.isLValue(node.expression.left)) {
                this.error(`Left-hand side expression must be a modifiable lvalue expression.`);
                return false;
            }

            // Type check assignment
            if (!Utils.typeEquals(rightType, leftType)) {
                this.error(`Assignment type mismatch, cannot assign ` +
                    `'${Utils.stringifyType(rightType)}' to '${Utils.stringifyType(leftType)}'.`);
                return false;
            }

            return true;
        }

        // Other expressions
        return !!this.getExpressionType(node.expression);
    }

    private visitConditionalStatement(node: ASTNode) {
        const booleanType = { varType: 'boolean', arraySizes: [] };
        const conditionType = this.getExpressionType(node.condition);
        if (!conditionType) {
            return false;
        }

        if (!Utils.typeEquals(conditionType, booleanType)) {
            this.error(`Condition of branching statement must evaluate to type 'boolean', ` +
                `instead got '${Utils.stringifyType(conditionType)}'.`);
            return false;
        }
        return true;
    }

    private visitReadStatement(node: ASTNode) {
        // Check expression type valid
        const expressionType = this.getExpressionType(node.expression);
        if (!expressionType) {
            return false;
        }

        // Check expression not lvalue
        if (!Utils.isLValue(node.expression)) {
            this.error(`Read statement argument must be a modifiable lvalue.`);
            return false;
        }

        return true;
    }

    private visitWriteStatement(node: ASTNode) {
        const voidType = { varType: 'void', arraySizes: [] };

        // Check expression type valid
        const expressionType = this.getExpressionType(node.expression);
        if (!expressionType) {
            return false;
        }

        // Check expression type not void
        if (Utils.typeEquals(expressionType, voidType)) {
            this.error(`Write statement argument cannot evaluate to type 'void'.`);
            return false;
        }

        return true;
    }

    private visitReturnStatement(node: ASTNode) {
        const functionEntry = this._currentTable.getParentEntry();
        const returnType = { varType: functionEntry.returnType, arraySizes: [] };

        // Check expression type valid
        const expressionType = this.getExpressionType(node.expression);
        if (!expressionType) {
            return false;
        }

        // Check expression type matches function return type
        if (!Utils.typeEquals(expressionType, returnType)) {
            this.error(`Return statement in function '${functionEntry.name}' must evaluate to type ` +
                `'${Utils.stringifyType(returnType)}', instead got '${Utils.stringifyType(expressionType)}'.`);
            return false;
        }

        return true;
    }

    private lookupShadowedFunctionMembers(name: string, symbolTableEntry: SymbolTableEntry) {
        const baseClassFunctions = symbolTableEntry.inheritanceList
            .map(c => symbolTableEntry.symbolTable.getParentTable().lookup(c))
            .reduce((arr, c) => [...arr, ...this.lookupShadowedFunctionMembers(name, c)], []);
        return [
            ...symbolTableEntry.symbolTable.lookupMultiple(name)
                .filter(s => s.type === 'function'),
            ...baseClassFunctions
        ];
    }

    private lookupShadowedDataMembers(name: string, symbolTableEntry: SymbolTableEntry) {
        const baseClassMembers = symbolTableEntry.inheritanceList
            .map(c => symbolTableEntry.symbolTable.getParentTable().lookup(c))
            .reduce((arr, c) => [...arr, ...this.lookupShadowedDataMembers(name, c)], []);
        return [
            ...symbolTableEntry.symbolTable.lookupMultiple(name)
                .filter(s => s.type === 'data'),
            ...baseClassMembers
        ];
    }

    private lookupShadowedMembers(name: string, symbolTableEntry: SymbolTableEntry) {
        const baseClassMembers = symbolTableEntry.inheritanceList
            .map(c => symbolTableEntry.symbolTable.getParentTable().lookup(c))
            .reduce((arr, c) => [...arr, ...this.lookupShadowedMembers(name, c)], []);
        return [
            ...symbolTableEntry.symbolTable.lookupMultiple(name),
            ...baseClassMembers
        ];
    }

    private isValidReturnType(type) {
        if (type === 'integer' || type === 'float' || type === 'void')
            return true;
        return !!this._currentTable.lookup(type);
    }

    private getExpressionType(expression: ASTNode) {
        // Primitive types
        const integerType = { varType: 'integer', arraySizes: [] };
        const floatType = { varType: 'float', arraySizes: [] };
        const booleanType = { varType: 'boolean', arraySizes: [] };

        // Update location
        this._lastLocation = expression.location || this._lastLocation;
        switch (expression.type) {
            case 'IntegerLiteral': {
                return integerType;
            }

            case 'FloatLiteral': {
                return floatType;
            }

            case 'BinaryExpression': {
                const leftType = this.getExpressionType(expression.left);
                const rightType = this.getExpressionType(expression.right);
                switch (expression.operator) {
                    case '+':
                    case '-':
                    case '*':
                    case '/':
                        if (Utils.typeEquals(leftType, integerType) && Utils.typeEquals(rightType, integerType))
                            return integerType;

                        if (Utils.typeEquals(leftType, floatType) && Utils.typeEquals(rightType, floatType))
                            return floatType;

                        this.error(`Arithmetic operator '${expression.operator}' must be used on 'integer' or 'float' types only, ` +
                            `instead got '${Utils.stringifyType(leftType)}' and '${Utils.stringifyType(rightType)}'.`);
                        return undefined;

                    case '||':
                    case '&&':
                        if (Utils.typeEquals(leftType, booleanType) && Utils.typeEquals(rightType, booleanType))
                            return booleanType;

                        this.error(`Logical operator '${expression.operator}' must be used on 'boolean' types only, `+
                            `instead got '${Utils.stringifyType(leftType)}' and '${Utils.stringifyType(rightType)}'.`);
                        return undefined;

                    case '==':
                    case '!=':
                    case '>=':
                    case '<=':
                    case '>':
                    case '<':
                        if (Utils.typeEquals(leftType, integerType) && Utils.typeEquals(rightType, integerType))
                            return booleanType;

                        if (Utils.typeEquals(leftType, floatType) && Utils.typeEquals(rightType, floatType))
                            return booleanType;

                        this.error(`Relational operator '${expression.operator}' must be used on 'integer' or 'float' types only, ` +
                            `instead got '${Utils.stringifyType(leftType)}' and '${Utils.stringifyType(rightType)}'.`);
                        return undefined;

                    default:
                        this.error(`Illegal binary expression operator.`);
                        return undefined;
                }
            }

            case 'UnaryExpression': {
                const type = this.getExpressionType(expression.expression);
                switch (expression.operator) {
                    case '+':
                    case '-':
                        if (Utils.typeEquals(type, integerType) || Utils.typeEquals(type, floatType))
                            return type;

                        this.error(`Unary arithmetic operator '${expression.operator}' must be used on 'integer' or 'float' types only, ` +
                            `instead got '${Utils.stringifyType(type)}'.`);
                        return undefined;

                    case '!':
                        if (Utils.typeEquals(type, booleanType))
                            return type;

                        this.error(`Unary negation operator '${expression.operator}' must be used on 'boolean' type only, ` +
                            `instead got '${Utils.stringifyType(type)}'.`);
                        return undefined;

                    default:
                        this.error(`Illegal unary expression operator.`);
                        return undefined;
                }
            }

            case 'IdentifierExpression':
            case 'MemberIndexExpression':
            case 'FunctionCallExpression': {
                const type = this.visitNestedIdentifierExpression(expression);
                if (!type)
                    return undefined;
                return type;
            }
        }
    }

    private visitInheritanceList(node: ASTNode, originalClass: ASTNode = node, visitedClasses: Map<string, number> = Map<string, number>().asMutable()) {
        // Update visited classes
        visitedClasses.update(node.name, 0, v => ++v);

        // Check for diamond inheritance problem
        const problemDependency = node.inheritanceList.find(baseClass => visitedClasses.get(baseClass, 0) > 0);
        if (problemDependency) {
            this.error(`Inheritance list of class '${originalClass.name}' causes a diamond inheritance problem ` +
                `because inherited class '${problemDependency}' in class definition '${node.name}' ` +
                `is already inherited in another intermediate base class of '${originalClass.name}'.`);
            return false;
        }

        // Check inherited classes are declared
        const baseClassEntries = node.inheritanceList.map(baseClass => {
            const entry = this._currentTable.lookup(baseClass);
            if (entry)
                entry.references++;
            return entry;
        });
        const missingClasses = baseClassEntries.filter(e => !e);
        if (missingClasses.length > 0) {
            missingClasses.forEach((_, i) => this.error(`Undeclared inherited class '${node.inheritanceList[i]}' in class definition '${node.name}'.`));
            return false;
        }

        // Propagate recursively
        return baseClassEntries.every(e => this.visitInheritanceList(e, originalClass, visitedClasses));
    }

    private getCurrentClassEntry(symbolTable: SymbolTable = this._currentTable) {
        if (!symbolTable)
            return undefined;

        const parentEntry = symbolTable.getParentEntry();
        if (!parentEntry)
            return undefined;

        if (parentEntry.type === 'class')
            return parentEntry;

        return this.getCurrentClassEntry(symbolTable.getParentTable());
    }

    private inheritsFrom(classEntry: SymbolTableEntry, baseClassEntry: SymbolTableEntry) {
        if (!classEntry)
            return false;

        if (classEntry === baseClassEntry)
            return true;

        const baseClassEntries = classEntry.inheritanceList.map(b => this._currentTable.lookup(b));
        return baseClassEntries.some(e => this.inheritsFrom(e, baseClassEntry));
    }

    private getVariableEntry(identifier: string) {
        const varEntry = this.identifierLookup(identifier);
        if (!varEntry) {
            this.error(`Undeclared identifier '${identifier}'.`);
            return false;
        } else if (varEntry?.type !== 'data' &&
            varEntry?.type !== 'parameter' &&
            varEntry?.type !== 'local') {
            this.error(`Previously declared identifier '${identifier}' refers to a ${varEntry.type} instead of a variable.`);
            return false;
        }
        return varEntry;
    }

    private visitParameters(parameters: ASTNode[]) {
        for (let p of parameters) {
            const duplicate = this.identifierLookup(p.name);
            if (duplicate && duplicate.type !== 'data') {
                this.error(`Multiply declared identifier '${duplicate.name}'.`);
                return false;
            }

            this._currentTable.insert({
                type: 'parameter',
                name: p.name,
                parentTable: this._currentTable,
                references: 0,
                varType: p.varType,
                arraySizes: p.arraySizes
            }, true);
        }
        return true;
    }

    private error(str: string) {
        this._error(`${this._lastLocation?.toString() || ''} ${str}`);
    }

    private warning(str: string) {
        this._warning(`${this._lastLocation?.toString() || ''} ${str}`);
    }

    private identifierLookup(name: string, symbolTable: SymbolTable = this._currentTable) {
        const entry = symbolTable.lookup(name);
        if (entry)
            return entry;

        const classEntry = this.getCurrentClassEntry(symbolTable);
        if (classEntry) {
            const members = this.lookupShadowedMembers(name, classEntry);
            return members[0];
        }

        return undefined;
    }

    public getGlobalSymbolTable() {
        return this._globalTable;
    }

}
