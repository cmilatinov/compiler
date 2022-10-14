import { ASTValidator } from '../../lib/ast/ast-validator';
import { ASTNode } from '../../lib/ast/ast-node';
import {
    BaseTypeSpecifier,
    BOOLEAN_TYPE,
    FLOAT_TYPE,
    FunctionTypeSpecifier,
    INTEGER_TYPE,
    STRING_TYPE,
    TypeSpecifier,
    VOID_PTR_TYPE,
    VOID_TYPE
} from './type-specifier';
import { BaseException, TypeException } from '../../lib/exceptions';
import { OperatorDefinitionTable } from '../operator/operator-definitions';
import { SymbolTable } from '../../lib/symbol-table';
import {
    BlockStatement,
    Expression,
    ExpressionStatement,
    ForStatement,
    FunctionDeclaration,
    IdentifierExpression,
    IfStatement,
    LiteralExpression,
    LiteralType,
    NodeType,
    OperatorExpression,
    Program,
    ReturnStatement,
    VariableDeclaration,
    VariableDeclarationKeyword,
    VariableStatement,
    WhileStatement
} from '../ast/ast-types';
import { SourceLocation } from '../../lib/tokenizer';
import {
    AdditiveOperatorList,
    AddressOfOp,
    AssignmentOp,
    BitwiseOperatorList,
    DeleteArrayOp,
    DeleteOp,
    DereferenceOp,
    EqualityOperatorList,
    FunctionCallOp,
    IndexOp,
    LogicalOperatorList,
    MemberAccessDereferenceOp,
    MemberAccessOp,
    MultiplicativeOperatorList,
    NewArrayOp,
    NewOp,
    NullCoalescingOp,
    Operator,
    PowerOperatorList,
    RelationalOperatorList,
    ShiftOperatorList,
    TernaryOp,
    TypecastOp
} from '../operator/operators';
import _ from 'lodash';
import { LocalVariableEntry, SymbolTableEntryType } from '../symbol-table/symbol-table-entries';

interface BaseOptions {
    operator: Operator;
    location: SourceLocation;
}

interface NewOptions extends BaseOptions {
    typeSpecifier: TypeSpecifier;
}

interface MemberAccessOptions extends BaseOptions {
    identifier: string;
}

interface TypecastOptions extends BaseOptions {
    typeSpecifier: BaseTypeSpecifier;
}

// noinspection JSMethodCanBeStatic, JSUnusedLocalSymbols
export class TypeChecker extends ASTValidator {
    private readonly _opTable: OperatorDefinitionTable;

    private _symbolTable: SymbolTable;
    private _currentTable: SymbolTable;
    private _currentFunction: FunctionDeclaration;

    public constructor() {
        super();
        this._opTable = new OperatorDefinitionTable();
        this._registerOperatorEntries();
        this._registerOperatorRules();
    }

    public execute({ ast, symbolTable }: { ast: ASTNode; symbolTable: SymbolTable }): any {
        this._symbolTable = this._currentTable = symbolTable;
        try {
            if (!super.validate(ast)) return false;
            return { ast, symbolTable };
        } catch (err) {
            const exception = err as BaseException;
            this.error(exception.message, exception.location);
            return false;
        }
    }

    private _literal(expression: LiteralExpression): BaseTypeSpecifier {
        switch (expression.type) {
            case LiteralType.BOOLEAN:
                return BOOLEAN_TYPE;
            case LiteralType.INTEGER:
                return INTEGER_TYPE;
            case LiteralType.FLOAT:
                return FLOAT_TYPE;
            case LiteralType.STRING:
                return STRING_TYPE;
            case LiteralType.NULL:
                return VOID_PTR_TYPE;
            case LiteralType.THIS:
                return VOID_PTR_TYPE;
        }
        throw new TypeException(`Illegal literal type '${expression.type}'.`, expression.location);
    }

    private _identifier(expression: IdentifierExpression): BaseTypeSpecifier {
        const entry = this._currentTable.lookup(expression.value);
        if (!entry) {
            throw new TypeException(
                `Undeclared identifier '${expression.value}'.`,
                expression.location
            );
        }
        switch (entry.type) {
            case SymbolTableEntryType.FUNCTION:
            case SymbolTableEntryType.PARAMETER:
            case SymbolTableEntryType.LOCAL_VARIABLE:
            case SymbolTableEntryType.CLASS_VARIABLE:
                return (entry as any).typeSpecifier;
        }
    }

    private _expression(expression: OperatorExpression): BaseTypeSpecifier {
        const { type, operator, operands, ...options } = expression;
        const types = operands.map((op) => this._type(op));
        const definition = this._opTable
            .getCandidateDefinitions(operator, options, types)
            .find((d) => {
                try {
                    d.parameters.forEach(
                        (p, i) =>
                            (expression.operands[i] = this._typecast(expression.operands[i], p))
                    );
                    return true;
                } catch (err) {
                    return false;
                }
            });

        if (!definition) {
            throw new TypeException(
                `No matching definition for operator '${operator}' ` +
                    `with operands ${types.map((t) => `'${t.toString()}'`).join(', ')}.`,
                expression.location
            );
        }

        return definition.returnType;
    }

    private _type(node: Expression): BaseTypeSpecifier {
        if (node.typeSpecifier) return node.typeSpecifier;
        let type: BaseTypeSpecifier;
        switch (true) {
            case node.type === NodeType.IDENTIFIER:
                type = this._identifier(node as IdentifierExpression);
                break;
            case Object.values<string>(LiteralType).includes(node.type):
                type = this._literal(node as LiteralExpression);
                break;
            default:
                type = this._expression(node as OperatorExpression);
                break;
        }
        node.typeSpecifier = type;
        return type;
    }

    private _typecheck(node: ASTNode, property: string, expected?: BaseTypeSpecifier) {
        try {
            const exp = _.get(node, property);
            if (!exp) return true;

            if (expected) {
                _.set(node, property, this._typecast(exp, expected));
            } else {
                this._type(exp);
            }
            return true;
        } catch (err) {
            const exception = err as BaseException;
            this.error(exception.message, exception.location);
            return false;
        }
    }

    private _typecast(expression: Expression, type: BaseTypeSpecifier): Expression {
        const expType = this._type(expression);
        if (expType.equals(type)) return expression;

        if (expType.canImplicitCast(type)) {
            return {
                type: NodeType.EXPRESSION,
                location: expression.location,
                operator: TypecastOp,
                operands: [expression],
                typeSpecifier: type
            };
        }

        if (expType.isReferenceTypeOf(type)) {
            return {
                type: NodeType.EXPRESSION,
                location: expression.location,
                operator: TypecastOp,
                operands: [expression],
                typeSpecifier: type
            };
        }

        if (type.isReferenceTypeOf(expType) && this._isLValue(expression)) {
            return {
                type: NodeType.EXPRESSION,
                location: expression.location,
                operator: TypecastOp,
                operands: [expression],
                typeSpecifier: type
            };
        }

        throw new TypeException(
            `No implicit conversion from ` +
                `'${expType.toString()}' ` +
                `to '${type.toString()}'.`,
            expression.location
        );
    }

    private _typeSpecifier(spec: BaseTypeSpecifier) {
        // Check that the type specifier does not refer to
        // anything other than a class or primitive type
        if (spec instanceof TypeSpecifier) {
            const type = spec as TypeSpecifier;
            const symbol = this._currentTable.lookup(type.value);
            if (symbol && symbol.type !== SymbolTableEntryType.CLASS) {
                throw new TypeException(
                    `Illegal type specifier '${type.toString()}'. ` +
                        `Type specifier must refer to a primitive type or a previously declared class type.`,
                    type.location
                );
            }
        } else if (spec instanceof FunctionTypeSpecifier) {
            const type = spec as FunctionTypeSpecifier;
            type.parameters.forEach((p) => this._typeSpecifier(p));
        }
        return true;
    }

    private _isLValue(node: ASTNode) {
        // TODO: Cover cases with class members and array indexes
        return !Object.values<string>(LiteralType).includes(node.type);
    }

    // =============================== OPERATOR RULES ===============================

    private _registerOperatorEntries() {
        // Increment / Decrement operators
        this._opTable.addDefinitionMultiple(
            [Operator.INCREMENT, Operator.DECREMENT],
            [
                // Prefix operators
                new FunctionTypeSpecifier([INTEGER_TYPE.createReferenceType()], INTEGER_TYPE),
                new FunctionTypeSpecifier([FLOAT_TYPE.createReferenceType()], FLOAT_TYPE),

                // Postfix w/ dummy int parameter
                new FunctionTypeSpecifier(
                    [INTEGER_TYPE.createReferenceType(), INTEGER_TYPE],
                    INTEGER_TYPE
                ),
                new FunctionTypeSpecifier(
                    [FLOAT_TYPE.createReferenceType(), INTEGER_TYPE],
                    FLOAT_TYPE
                )
            ]
        );

        // Unary plus / minus operators
        this._opTable.addDefinitionMultiple(
            [Operator.UNARY_PLUS, Operator.UNARY_MINUS],
            [
                new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE),
                new FunctionTypeSpecifier([FLOAT_TYPE], FLOAT_TYPE)
            ]
        );

        // Logical Not operator
        this._opTable.addDefinition(
            Operator.LOGICAL_NOT,
            new FunctionTypeSpecifier([BOOLEAN_TYPE], BOOLEAN_TYPE)
        );

        // Bitwise Not operator
        this._opTable.addDefinition(
            Operator.BITWISE_NOT,
            new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE)
        );

        // Arithmetic operators
        this._opTable.addDefinitionMultiple(
            [...PowerOperatorList, ...MultiplicativeOperatorList, ...AdditiveOperatorList],
            [
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE)
            ]
        );

        // Shift & Bitwise operators
        this._opTable.addDefinitionMultiple(
            [...ShiftOperatorList, ...BitwiseOperatorList],
            [new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE)]
        );

        // Relational and equality operators
        this._opTable.addDefinitionMultiple(
            [...RelationalOperatorList, ...EqualityOperatorList],
            [
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE),
                new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE)
            ]
        );

        // Logical operators
        this._opTable.addDefinitionMultiple(
            [...LogicalOperatorList],
            [new FunctionTypeSpecifier([BOOLEAN_TYPE, BOOLEAN_TYPE], BOOLEAN_TYPE)]
        );
    }

    private _registerOperatorRules() {
        const operators = {
            NewOp,
            NewArrayOp,
            DeleteOp,
            DeleteArrayOp,
            MemberAccessOp,
            MemberAccessDereferenceOp,
            FunctionCallOp,
            TypecastOp,
            IndexOp,
            AddressOfOp,
            DereferenceOp,
            NullCoalescingOp,
            TernaryOp,
            AssignmentOp
        };
        Object.entries(operators).forEach(([name, operator]) => {
            const fnName = `_${_.lowerFirst(_.camelCase(name))}`;
            const fn = this[fnName];
            if (fn) {
                this._opTable.addDefinitionRule(operator as Operator, fn.bind(this));
            }
        });
    }

    private _newOp({ location, typeSpecifier }: NewOptions) {
        if (typeSpecifier.isPointerType() || typeSpecifier.isPrimitiveType()) {
            const returnType = typeSpecifier.createPointerType();
            return [
                new FunctionTypeSpecifier([], returnType),
                new FunctionTypeSpecifier([typeSpecifier], returnType)
            ];
        }

        // TODO: Lookup class constructor
        this._symbolTable.lookup(typeSpecifier.value);

        return new TypeException('', location);
    }

    private _newArrayOp({ location, typeSpecifier }: NewOptions, typeList: BaseTypeSpecifier[]) {
        if (typeSpecifier.isPointerType() || typeSpecifier.isPrimitiveType()) {
            const returnType = typeList.reduce((acc) => acc.createPointerType(), typeSpecifier);
            return [
                new FunctionTypeSpecifier(
                    typeList.map(() => INTEGER_TYPE),
                    returnType
                )
            ];
        }

        // TODO: Lookup class constructor with no args
        this._symbolTable.lookup(typeSpecifier.value);

        return new TypeException('', location);
    }

    private _deleteOp({ location }: BaseOptions, [expression]: BaseTypeSpecifier[]) {
        if (expression.isPointerType()) {
            return [new FunctionTypeSpecifier([expression], VOID_TYPE)];
        }
        return new TypeException('Delete expression must evaluate to pointer type.', location);
    }

    private _deleteArrayOp(options: BaseOptions, parameters: BaseTypeSpecifier[]) {
        return this._deleteOp(options, parameters);
    }

    // TODO
    private _memberAccessOp(
        { location, identifier }: MemberAccessOptions,
        [expression]: BaseTypeSpecifier[]
    ) {
        if (!expression.isClassType()) {
            return new TypeException(
                `Illegal member access on non-class type '${expression.toString()}'.`,
                location
            );
        }

        // TODO: Lookup class member with identifier

        return new TypeException(`Unimplemented operator.`, location);
    }

    // TODO
    private _memberAccessDereferenceOp(
        { location, identifier }: MemberAccessOptions,
        [expression]: BaseTypeSpecifier[]
    ) {
        if (!expression.isPointerType()) {
            return new TypeException(
                `Illegal dereferenced member access on ` +
                    `non-pointer type '${expression.toString()}'.`,
                location
            );
        }

        const classType = expression.createDereferencedType();
        if (!classType.isClassType()) {
            return new TypeException(
                `Illegal dereferenced member access on ` +
                    `primitive pointer type '${expression.toString()}'.`,
                location
            );
        }

        // TODO: Lookup class member with identifier

        return new TypeException(`Unimplemented operator.`, location);
    }

    private _functionCallOp({ location }: BaseOptions, [fn, ...args]: BaseTypeSpecifier[]) {
        if (fn.isFunctionType()) {
            const fnType = fn as FunctionTypeSpecifier;
            if (fnType.parameters.length !== args.length) {
                return new TypeException(
                    `Function of type '${fnType.toString()}' ` +
                        `called with wrong number of arguments. ` +
                        `Expected ${fnType.parameters.length} ` +
                        `argument${fnType.parameters.length !== 1 ? 's' : ''} ` +
                        `but function call has ${args.length} ` +
                        `argument${args.length !== 1 ? 's' : ''}.`,
                    location
                );
            }

            if (fnType.parameters.some((p, i) => !p.equals(args[i]))) {
                return new TypeException(
                    `Function of type '${fnType.toString()}' ` +
                        `called with wrong argument types. ` +
                        `Expected ${fnType.parameters
                            .map((p) => `'${p.toString()}'`)
                            .join(', ')} ` +
                        `but function call was executed with ` +
                        `${args.map((a) => `'${a.toString()}'`).join(', ')}.`,
                    location
                );
            }

            return [new FunctionTypeSpecifier([fn, ...args], fnType.returnType)];
        }

        // TODO
        if (fn.isClassType()) {
        }

        return new TypeException(
            `Illegal function call expression on non-callable type '${fn.toString()}'.`,
            location
        );
    }

    private _typecastOp({ typeSpecifier }: TypecastOptions, [expression]: BaseTypeSpecifier[]) {
        return [new FunctionTypeSpecifier([expression], typeSpecifier)];
    }

    private _indexOp({ location }: BaseOptions, [expression, index]: BaseTypeSpecifier[]) {
        if (expression.isPointerType() && !index.equals(INTEGER_TYPE)) {
            return new TypeException(
                `Index expression must evaluate to type ` +
                    `'${INTEGER_TYPE.toString()}', instead got '${index.toString()}'.`,
                location
            );
        } else if (expression.isPointerType()) {
            return [
                new FunctionTypeSpecifier([expression, index], expression.createDereferencedType())
            ];
        }
        // NOTE: Overloaded index operator on class types
        // will be implemented through a static table entry.
        return [];
    }

    private _addressOfOp(_, [expression]: BaseTypeSpecifier[]) {
        return [new FunctionTypeSpecifier([expression], expression.createPointerType())];
    }

    private _dereferenceOp({ location }: BaseOptions, [expression]: BaseTypeSpecifier[]) {
        if (!expression.isPointerType()) {
            return new TypeException(
                `Dereference operator must be used on a pointer type only, ` +
                    `instead got '${expression.toString()}'.`,
                location
            );
        }
        return [new FunctionTypeSpecifier([expression], expression.createDereferencedType())];
    }

    private _nullCoalescingOp({ location }: BaseOptions, [first]: BaseTypeSpecifier[]) {
        if (!first.isPointerType()) {
            return new TypeException(
                `Null coalescing expression may only be applied to ` +
                    `pointer types, instead got '${first.toString()}'.`,
                location
            );
        }
        return [new FunctionTypeSpecifier([first, first], first)];
    }

    private _ternaryOp(_, [condition, trueExp]: BaseTypeSpecifier[]) {
        return [new FunctionTypeSpecifier([condition, trueExp, trueExp], trueExp)];
    }

    private _assignmentOp(_, [left]: BaseTypeSpecifier[]) {
        if (left.isReferenceType())
            return [new FunctionTypeSpecifier([left, left.createUnreferencedType()], left)];
        return [new FunctionTypeSpecifier([left.createReferenceType(), left], left)];
    }

    private _visitFunctionDeclaration(decl: FunctionDeclaration) {
        this._currentTable = this._currentTable.lookup(decl.name).symbolTable;
        this._currentFunction = decl;
        return (
            decl.parameters.every((p) => this._typeSpecifier(p.typeSpecifier)) &&
            decl.body.every((s) => this._statement(s))
        );
    }

    private _postVisitFunctionDeclaration(decl: FunctionDeclaration) {
        this._currentTable = this._currentTable.getParentTable() || this._symbolTable;
        this._currentFunction = undefined;
        return true;
    }

    private _postVisitProgram(program: Program) {
        const hasMainFn = !!program.sourceElements.find((statement) => {
            if (statement.type !== NodeType.FUNCTION_DECLARATION) return false;

            const fnDecl = statement as FunctionDeclaration;
            if (fnDecl.name !== 'main') return false;

            if (fnDecl.parameters.length > 0) return false;

            return fnDecl.returnType.equals(INTEGER_TYPE) || fnDecl.returnType.equals(VOID_TYPE);
        });
        if (!hasMainFn) {
            this.error(
                `Program must contain a valid 'main' function of type 'main() -> void' or 'main() -> int'.`
            );
            return false;
        }
        return true;
    }

    private _statement(node: ASTNode) {
        switch (node.type) {
            case NodeType.VARIABLE_STATEMENT:
                return this._variableStatement(node as VariableStatement);
            case NodeType.EXPRESSION_STATEMENT:
                return this._expressionStatement(node as ExpressionStatement);
            case NodeType.IF_STATEMENT:
                return this._ifStatement(node as IfStatement);
            case NodeType.DO_WHILE_STATEMENT:
            case NodeType.WHILE_STATEMENT:
                return this._whileStatement(node as WhileStatement);
            case NodeType.FOR_STATEMENT:
                return this._forStatement(node as ForStatement);
            case NodeType.BLOCK_STATEMENT:
                return this._blockStatement(node as BlockStatement);
            case NodeType.RETURN_STATEMENT:
                return this._returnStatement(node as ReturnStatement);
        }
    }

    private _variableStatement(statement: VariableStatement) {
        for (const decl of statement.declList) {
            try {
                this._variableDeclaration(statement.declKeyword, decl);
            } catch (err) {
                const exception = err as BaseException;
                this.error(exception.message, exception.location);
                return false;
            }
        }
        return true;
    }

    private _variableDeclaration(
        declKeyword: VariableDeclarationKeyword,
        decl: VariableDeclaration
    ) {
        if (!decl.variableInitializer && declKeyword === VariableDeclarationKeyword.CONST) {
            throw new TypeException(
                `Const variable '${decl.name}' must have an initializer.`,
                decl.location
            );
        }

        if (decl.typeSpecifier && decl.variableInitializer) {
            this._typeSpecifier(decl.typeSpecifier);
            // Type check initializer
            decl.variableInitializer.expression = this._typecast(
                decl.variableInitializer.expression,
                decl.typeSpecifier
            );
        } else if (!decl.typeSpecifier && decl.variableInitializer) {
            // Infer variable type from initializer
            decl.typeSpecifier = this._type(decl.variableInitializer.expression);
            const entry = this._currentTable.lookup(
                decl.name,
                SymbolTableEntryType.LOCAL_VARIABLE
            ) as LocalVariableEntry;
            entry.typeSpecifier = decl.typeSpecifier;
        } else if (!decl.typeSpecifier && !decl.variableInitializer) {
            // Illegal declaration
            throw new TypeException(
                `Illegal variable declaration '${decl.name}'. ` +
                    `Declaration must contain either a type specifier or an initializer.`,
                decl.location
            );
        }
    }

    private _expressionStatement(statement: ExpressionStatement) {
        return this._typecheck(statement, 'expression');
    }

    private _ifStatement(statement: IfStatement) {
        return this._typecheck(statement, 'condition', BOOLEAN_TYPE);
    }

    private _whileStatement(statement: WhileStatement) {
        if (!this._typecheck(statement, 'condition', BOOLEAN_TYPE)) return false;
        return this._statement(statement.body);
    }

    private _forStatement(statement: ForStatement) {
        if (
            !this._typecheck(statement, 'expressions[0]') ||
            !this._typecheck(statement, 'expressions[1]') ||
            !this._typecheck(statement, 'expressions[2]')
        )
            return false;
        return this._statement(statement.body);
    }

    private _blockStatement(statement: BlockStatement) {
        for (const innerStatement of statement.statements) {
            if (!this._statement(innerStatement)) return false;
        }
        return true;
    }

    private _returnStatement(statement: ReturnStatement) {
        if (
            (statement.expression &&
                !this._typecheck(statement, 'expression', this._currentFunction.returnType)) ||
            (!statement.expression && !this._currentFunction.returnType.equals(VOID_TYPE))
        ) {
            this.error(`Return statement must match function return type.`, statement.location);
            return false;
        }
        return true;
    }
}
