import { CodeGenerator } from '../../../lib/tac';
import { PipelineStage } from '../../../lib/pipeline';
import { SymbolTable } from '../../../lib/symbol-table';
import { ASTNode } from '../../../lib/ast/ast-node';
import { printAST, traverse } from '../../../lib/ast/ast-utils';
import {
    Expression,
    FunctionDeclaration,
    IdentifierExpression,
    LiteralExpression,
    LiteralType,
    NodeType,
    OperatorExpression,
    ReturnStatement,
    VariableStatement
} from '../../ast/ast-types';
import {
    FunctionEntry,
    SymbolTableEntryType,
    TemporaryEntry
} from '../../symbol-table/symbol-table-entries';
import { LabelGenerator } from '../../../lib/code-generator';
import { Operator } from '../../operator/operators';
import { BaseTypeSpecifier, FunctionTypeSpecifier, VOID_TYPE } from '../../type/type-specifier';

export class CodeGeneratorSCLang extends CodeGenerator implements PipelineStage {
    private _symbolTable: SymbolTable;
    private _currentTable: SymbolTable;
    private _tempGen: LabelGenerator;

    constructor() {
        super();
    }

    execute({ ast, symbolTable }: { ast: ASTNode; symbolTable: SymbolTable }): any {
        this._symbolTable = this._currentTable = symbolTable;
        this._traverse(ast);
        return this.toString();
    }

    // ================ Visitor Functions ================
    private _visitFunctionDeclaration(decl: FunctionDeclaration) {
        const entry = this._currentTable.lookup(
            decl.name,
            SymbolTableEntryType.FUNCTION
        ) as FunctionEntry;
        this._currentTable = entry.symbolTable;
        this._tempGen = new LabelGenerator('t', 0);
        entry.instructionBlock = this._block(decl.name);
        this._function(decl.name);
        decl.body.forEach((s) => this._statement(s));
        this._currentTable = this._currentTable.getParentTable() || this._symbolTable;
    }

    // ================ Statements ================
    private _statement(node: ASTNode) {
        switch (node.type) {
            case NodeType.VARIABLE_STATEMENT:
                return this._variableStatement(node as VariableStatement);
            case NodeType.RETURN_STATEMENT:
                return this._returnStatement(node as ReturnStatement);
        }
    }

    private _variableStatement(statement: VariableStatement) {
        statement.declList.forEach((d) => {
            // this._decl(d.name);
            if (d.variableInitializer) {
                const temp = this._expression(d.variableInitializer.expression);
                this._copy(d.name, temp);
            }
        });
    }

    private _returnStatement(statement: ReturnStatement) {
        const temp = statement.expression ? this._expression(statement.expression) : undefined;
        this._return(temp);
    }

    // ================ Expressions ================
    private _expression(expr: Expression): string {
        switch (expr.type) {
            case LiteralType.INTEGER:
            case LiteralType.FLOAT:
            case LiteralType.STRING:
            case LiteralType.BOOLEAN:
            case LiteralType.NULL:
            case LiteralType.THIS:
                return this._literal(expr as LiteralExpression);
            case NodeType.IDENTIFIER:
                return this._identifier(expr as IdentifierExpression);
            case NodeType.EXPRESSION:
                return this._operatorExpression(expr as OperatorExpression);
        }
    }

    private _literal(expr: LiteralExpression) {
        switch (expr.type) {
            case LiteralType.INTEGER:
            case LiteralType.FLOAT:
            case LiteralType.STRING:
            case LiteralType.BOOLEAN:
            case LiteralType.THIS:
                return expr.value;
            case LiteralType.NULL:
                return '0';
        }
    }

    private _identifier(expr: IdentifierExpression) {
        return expr.value;
    }

    private _operatorExpression(expr: OperatorExpression) {
        if (expr.operator === Operator.FUNCTION_CALL) {
            return this._functionCall(expr);
        }

        switch (expr.operands.length) {
            case 1: {
                const right = this._expression(expr.operands[0]);
                const temp = this._allocTemp(expr.typeSpecifier);
                this._assign(temp, expr.operator, right);
                return temp;
            }
            case 2: {
                const left = this._expression(expr.operands[0]);
                const right = this._expression(expr.operands[1]);
                const temp = this._allocTemp(expr.typeSpecifier);
                this._assign(temp, expr.operator, right, left);
                return temp;
            }
        }
    }

    private _functionCall(expr: OperatorExpression) {
        const fn = expr.operands[0];
        if (fn.typeSpecifier.isFunctionType() && fn.type === NodeType.IDENTIFIER) {
            const params = expr.operands.slice(1);
            const fnType = fn.typeSpecifier as FunctionTypeSpecifier;
            const returnValue = !fnType.returnType.equals(VOID_TYPE)
                ? this._allocTemp(fnType.returnType)
                : undefined;
            const block = (
                this._currentTable.lookup(
                    (fn as IdentifierExpression).value,
                    SymbolTableEntryType.FUNCTION
                ) as FunctionEntry
            )?.instructionBlock;
            params
                .map((p) => this._expression(p))
                .reverse()
                .forEach((p) => this._param(p));
            this._call(block, returnValue);
            return returnValue;
        }
        // TODO: Handle overloaded function call operators
        return undefined;
    }

    // ================ AST Traversal ================
    private _traverse(node: ASTNode) {
        return traverse.call(this, node);
    }

    // ================ Helper Functions ================
    private _allocTemp(type: BaseTypeSpecifier) {
        const name = this._tempGen.generateLabel();
        const entry: TemporaryEntry = {
            type: SymbolTableEntryType.TEMPORARY,
            location: null,
            name,
            references: 0,
            parentTable: this._currentTable,
            typeSpecifier: type
        };
        this._currentTable.insert(entry);
        // const temp = this._alloc(name);
        return name;
    }
}
