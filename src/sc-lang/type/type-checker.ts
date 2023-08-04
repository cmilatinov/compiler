import { ASTValidator } from '../../lib/ast/ast-validator';
import { ASTNode } from '../../lib/ast/ast-node';
import {
    BaseTypeSpecifier,
    BOOLEAN_TYPE,
    FLOAT_TYPE,
    INTEGER_TYPE,
    STRING_TYPE,
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
import { Operator } from '../operator/operators';
import { LocalVariableEntry, SymbolTableEntryType } from '../symbol-table/symbol-table-entries';
import { OperatorImplementations } from '../operator/operator-implementations';
import _ from 'lodash';

export class TypeChecker extends ASTValidator {
    private _opTable: OperatorDefinitionTable;
    private _symbolTable: SymbolTable;
    private _currentTable: SymbolTable;
    private _currentFunction: FunctionDeclaration;

    public execute({ ast, symbolTable }: { ast: ASTNode; symbolTable: SymbolTable }): any {
        this._symbolTable = this._currentTable = symbolTable;
        this._opTable = OperatorImplementations.createOperatorTable(this._symbolTable);
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
                    d.type.parameters.forEach(
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

        return definition.type.returnType;
    }

    private _type(node: Expression): BaseTypeSpecifier {
        if (
            node.typeSpecifier &&
            (node.type !== NodeType.EXPRESSION ||
                (node as OperatorExpression).operator !== Operator.TYPECAST)
        )
            return node.typeSpecifier;
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
                operator: Operator.TYPECAST,
                operands: [expression],
                typeSpecifier: type
            };
        }

        if (expType.isReferenceTypeOf(type)) {
            return {
                type: NodeType.EXPRESSION,
                location: expression.location,
                operator: Operator.TYPECAST,
                operands: [expression],
                typeSpecifier: type
            };
        }

        if (type.isReferenceTypeOf(expType) && this._isLValue(expression)) {
            return {
                type: NodeType.EXPRESSION,
                location: expression.location,
                operator: Operator.TYPECAST,
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
        if (spec.isFunctionType()) {
            const type = spec.asFunctionType();
            type.parameters.forEach((p) => this._typeSpecifier(p));
            this._typeSpecifier(type.returnType);
            return true;
        }

        // Check that the type specifier does not refer to
        // anything other than a class or primitive type
        const type = spec.asType();
        if (type.isClassType()) {
            const symbol = this._currentTable.lookup(type.value);
            if (!symbol) {
                throw new TypeException(
                    `Illegal type specifier '${type.toString()}'. ` +
                        `Type specifier must refer to a primitive type or a previously declared class type.`,
                    type.location
                );
            }
        } else if (type.isReferenceType()) {
            return this._typeSpecifier(type.createUnreferencedType());
        } else if (type.isPointerType()) {
            return this._typeSpecifier(type.createDereferencedType());
        }
        return true;
    }

    private _isLValue(node: ASTNode) {
        // TODO: Cover cases with class members and array indexes
        return !Object.values<string>(LiteralType).includes(node.type);
    }

    // =============================== AST Visit ===============================
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
            case NodeType.EMPTY_STATEMENT:
                return true;
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
        return (
            this._typecheck(statement, 'condition', BOOLEAN_TYPE) &&
            this._statement(statement.ifBody) &&
            (!statement.elseBody || this._statement(statement.elseBody))
        );
    }

    private _whileStatement(statement: WhileStatement) {
        return (
            this._typecheck(statement, 'condition', BOOLEAN_TYPE) && this._statement(statement.body)
        );
    }

    private _forStatement(statement: ForStatement) {
        return (
            this._typecheck(statement, 'expressions[0]') &&
            this._typecheck(statement, 'expressions[1]') &&
            this._typecheck(statement, 'expressions[2]') &&
            this._statement(statement.body)
        );
    }

    private _blockStatement(statement: BlockStatement) {
        return statement.statements.every((s) => this._statement(s));
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
