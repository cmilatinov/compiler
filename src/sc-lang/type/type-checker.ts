import {
    ASTValidator,
    DEFAULT_ERROR_PROCESSOR,
    DEFAULT_WARNING_PROCESSOR
} from '../../lib/ast/ast-validator';
import { Expression, IdentifierExpression, LiteralExpression } from '../ast/ast-expression-types';
import { ASTNode } from '../../lib/ast/ast-node';
import { BaseTypeSpecifier, FunctionTypeSpecifier, TypeSpecifier } from './type-specifier';
import * as TypeUtils from './type-utils';
import { BaseException, TypeException } from '../../lib/exceptions';
import {
    BOOLEAN_TYPE,
    FLOAT_TYPE,
    INTEGER_TYPE,
    STRING_TYPE,
    VOID_PTR_TYPE,
    VOID_TYPE
} from './types';
import { StringProcessor } from '../../lib/string-processor';
import { OperatorDefinitionTable } from '../operator/operator-definitions';
import { SymbolTable } from '../../lib/symbol-table/symbol-table';
import {
    BlockStatement,
    DoWhileStatement,
    ExpressionStatement,
    ForStatement,
    FunctionDeclaration,
    IfStatement,
    VariableDeclaration,
    VariableStatement,
    WhileStatement
} from '../ast/ast-types';
import { SourceLocation } from '../../lib/tokenizer';
import {
    AdditionOp,
    AdditiveOperatorList,
    AddressOfOp,
    AssignmentOp,
    BitwiseNotOp,
    BitwiseOperatorList,
    DecrementOp,
    DeleteArrayOp,
    DeleteOp,
    DereferenceOp,
    EqualityOperatorList,
    FunctionCallOp,
    IncrementOp,
    IndexOp,
    LogicalNotOp,
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
    SubtractionOp,
    TernaryOp,
    TypecastOp
} from '../operator/operators';
import _ from 'lodash';
import { LocalVariableEntry } from '../symbol-table/symbol-table-entries';

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

// noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
export class TypeChecker extends ASTValidator {
    private readonly _opTable: OperatorDefinitionTable;
    private readonly _symbolTable: SymbolTable;

    private _currentTable: SymbolTable;

    public constructor(
        warning: StringProcessor = DEFAULT_WARNING_PROCESSOR,
        error: StringProcessor = DEFAULT_ERROR_PROCESSOR,
        imports: { symbolTable: SymbolTable }
    ) {
        super(warning, error);
        this._symbolTable = this._currentTable = imports.symbolTable;
        this._opTable = new OperatorDefinitionTable();
        this._registerOperatorEntries();
        this._registerOperatorRules();
    }

    public getExports() {
        return {};
    }

    private _literal(expression: LiteralExpression): BaseTypeSpecifier {
        switch (expression.type) {
            case 'BooleanLiteral':
                return BOOLEAN_TYPE;
            case 'IntLiteral':
                return INTEGER_TYPE;
            case 'FloatLiteral':
                return FLOAT_TYPE;
            case 'StringLiteral':
                return STRING_TYPE;
            case 'NullLiteral':
                return VOID_PTR_TYPE;
            case 'ThisLiteral':
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
            case 'function':
            case 'parameter':
            case 'local':
            case 'data':
                return (entry as any).typeSpecifier;
        }
    }

    private _expression(expression: Expression): BaseTypeSpecifier {
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

    private _type(node: ASTNode): BaseTypeSpecifier {
        if (node.type === 'Identifier') return this._identifier(node as IdentifierExpression);
        if (node.type.endsWith('Literal')) return this._literal(node as LiteralExpression);
        if (node.type.endsWith('TypeSpecifier')) return node as BaseTypeSpecifier;
        return this._expression(node as Expression);
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
        if (TypeUtils.typeEquals(expType, type)) return expression;

        if (TypeUtils.canImplicitCast(expType, type)) {
            return {
                type: 'Expression',
                location: expression.location,
                operator: 'type()',
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

    // =============================== OPERATOR RULES ===============================

    private _registerOperatorEntries() {
        // Increment / Decrement operators
        this._opTable.addDefinitionMultiple(
            [IncrementOp, DecrementOp],
            [
                // Prefix operators
                new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE),
                new FunctionTypeSpecifier([FLOAT_TYPE], FLOAT_TYPE),

                // Postfix w/ dummy int parameter
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                new FunctionTypeSpecifier([FLOAT_TYPE, INTEGER_TYPE], FLOAT_TYPE)
            ]
        );

        // Unary plus / minus operators
        this._opTable.addDefinitionMultiple(
            [AdditionOp, SubtractionOp],
            [
                new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE),
                new FunctionTypeSpecifier([FLOAT_TYPE], FLOAT_TYPE)
            ]
        );

        // Logical Not operator
        this._opTable.addDefinition(
            LogicalNotOp,
            new FunctionTypeSpecifier([BOOLEAN_TYPE], BOOLEAN_TYPE)
        );

        // Bitwise Not operator
        this._opTable.addDefinition(
            BitwiseNotOp,
            new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE)
        );

        // String concatenation operator
        this._opTable.addDefinition(
            AdditionOp,
            new FunctionTypeSpecifier([STRING_TYPE, STRING_TYPE], STRING_TYPE)
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
                this._opTable.addDefinitionRule(operator, fn.bind(this));
            }
        });
    }

    private _newOp({ location, typeSpecifier }: NewOptions) {
        if (TypeUtils.isPointerType(typeSpecifier) || TypeUtils.isPrimitiveType(typeSpecifier)) {
            const returnType = TypeUtils.createPointerType(typeSpecifier);
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
        if (TypeUtils.isPointerType(typeSpecifier) || TypeUtils.isPrimitiveType(typeSpecifier)) {
            const returnType = typeList.reduce(
                (acc) => TypeUtils.createPointerType(acc),
                typeSpecifier
            );
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
        if (TypeUtils.isPointerType(expression)) {
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
        if (!TypeUtils.isClassType(expression)) {
            return new TypeException(
                `Illegal member access on primitive type '${expression.toString()}'.`,
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
        if (!TypeUtils.isPointerType(expression)) {
            return new TypeException(
                `Illegal dereferenced member access on ` +
                    `non-pointer type '${expression.toString()}'.`,
                location
            );
        }

        const classType = TypeUtils.createDereferencedType(expression);
        if (!TypeUtils.isClassType(classType)) {
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
        if (TypeUtils.isFunctionType(fn)) {
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

            if (fnType.parameters.every((p, i) => p.equals(args[i]))) {
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
        if (TypeUtils.isClassType(fn)) {
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
        if (TypeUtils.isPointerType(expression) && !index.equals(INTEGER_TYPE)) {
            return new TypeException(
                `Index expression must evaluate to type ` +
                    `'${INTEGER_TYPE.toString()}', instead got '${index.toString()}'.`,
                location
            );
        } else if (TypeUtils.isPointerType(expression)) {
            return [
                new FunctionTypeSpecifier(
                    [expression, index],
                    TypeUtils.createDereferencedType(expression)
                )
            ];
        }
        // NOTE: Overloaded index operator on class types
        // will be implemented through a static table entry.
        return [];
    }

    private _addressOfOp(_, [expression]: BaseTypeSpecifier[]) {
        return [new FunctionTypeSpecifier([expression], TypeUtils.createPointerType(expression))];
    }

    private _dereferenceOp({ location }: BaseOptions, [expression]: BaseTypeSpecifier[]) {
        if (!TypeUtils.isPointerType(expression)) {
            return new TypeException(
                `Dereference operator must be used on a pointer type only, ` +
                    `instead got '${expression.toString()}'.`,
                location
            );
        }
        return [
            new FunctionTypeSpecifier([expression], TypeUtils.createDereferencedType(expression))
        ];
    }

    private _nullCoalescingOp({ location }: BaseOptions, [first]: BaseTypeSpecifier[]) {
        if (!TypeUtils.isPointerType(first)) {
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
        return [new FunctionTypeSpecifier([left, left], left)];
    }

    private _visitFunctionDeclaration(decl: FunctionDeclaration) {
        this._currentTable = this._currentTable.lookup(decl.name).symbolTable;
        return decl.body.map((s) => this._statement(s)).every((s) => s);
    }

    private _postVisitFunctionDeclaration(decl: FunctionDeclaration) {
        this._currentTable = this._currentTable.getParentTable() || this._symbolTable;
        return true;
    }

    private _statement(node: ASTNode) {
        switch (node.type) {
            case 'VariableStatement':
                return this._variableStatement(node as VariableStatement);
            case 'ExpressionStatement':
                return this._expressionStatement(node as ExpressionStatement);
            case 'IfStatement':
                return this._ifStatement(node as IfStatement);
            case 'WhileStatement':
            case 'DoWhileStatement':
                return this._whileStatement(node as WhileStatement);
            case 'BlockStatement':
                return this._blockStatement(node as BlockStatement);
        }
    }

    private _variableStatement(statement: VariableStatement) {
        for (const decl of statement.declList) {
            try {
                this._verifyVariableDeclaration(decl, statement.declKeyword === 'const');
            } catch (err) {
                const exception = err as BaseException;
                this.error(exception.message, exception.location);
                return false;
            }
        }
        return true;
    }

    private _verifyVariableDeclaration(decl: VariableDeclaration, isConst: boolean) {
        if (!decl.variableInitializer && isConst) {
            throw new TypeException(
                `Const variable '${decl.name}' must have an initializer.`,
                decl.location
            );
        }

        if (decl.typeSpecifier && decl.variableInitializer) {
            // Type check initializer
            decl.variableInitializer.expression = this._typecast(
                decl.variableInitializer.expression,
                decl.typeSpecifier
            );
        } else if (!decl.typeSpecifier && decl.variableInitializer) {
            // Infer variable type from initializer
            decl.typeSpecifier = this._type(decl.variableInitializer.expression);
            const entry = this._currentTable.lookup(decl.name, 'local') as LocalVariableEntry;
            entry.typeSpecifier = decl.typeSpecifier;
        } else if (!decl.typeSpecifier && !decl.variableInitializer) {
            // Illegal declaration
            throw new TypeException(
                `Illegal variable declaration '${decl.name}'. ` +
                    `Declaration must contain either a type specifier or initializer.`,
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
}
