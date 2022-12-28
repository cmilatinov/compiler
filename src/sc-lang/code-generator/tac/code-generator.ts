import { Set } from 'immutable';
import { CodeGeneratorTAC, ConditionalJumpInstruction, InstructionBlock } from '../../../lib/tac';
import { PipelineStage } from '../../../lib/pipeline';
import { SymbolTable } from '../../../lib/symbol-table';
import { ASTNode } from '../../../lib/ast/ast-node';
import { traverse } from '../../../lib/ast/ast-utils';
import {
    BlockStatement,
    DoWhileStatement,
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
    ReturnStatement,
    VariableStatement,
    WhileStatement
} from '../../ast/ast-types';
import {
    FunctionEntry,
    SymbolTableEntryType,
    TemporaryEntry
} from '../../symbol-table/symbol-table-entries';
import { LabelGenerator } from '../../../lib/code-generator';
import { Operator } from '../../operator/operators';
import { BaseTypeSpecifier, FunctionTypeSpecifier, VOID_TYPE } from '../../type/type-specifier';

export class CodeGeneratorSCLangTAC extends CodeGeneratorTAC implements PipelineStage {
    private _symbolTable: SymbolTable;
    private _currentTable: SymbolTable;
    private _tempGen: LabelGenerator;

    constructor() {
        super();
    }

    execute({ ast, symbolTable }: { ast: ASTNode; symbolTable: SymbolTable }): any {
        this._symbolTable = this._currentTable = symbolTable;
        this._traverse(ast);
        return { ast, symbolTable, codeBlocks: this._blocks };
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
        this._endFunction(decl.name);
        this._postProcessFunction();
        this._currentTable = this._currentTable.getParentTable() || this._symbolTable;
    }

    // ================ Statements ================
    private _statement(node: ASTNode) {
        switch (node.type) {
            case NodeType.VARIABLE_STATEMENT:
                return this._variableStatement(node as VariableStatement);
            case NodeType.RETURN_STATEMENT:
                return this._returnStatement(node as ReturnStatement);
            case NodeType.EXPRESSION_STATEMENT:
                return this._expressionStatement(node as ExpressionStatement);
            case NodeType.BLOCK_STATEMENT:
                return this._blockStatement(node as BlockStatement);
            case NodeType.WHILE_STATEMENT:
                return this._whileStatement(node as WhileStatement);
            case NodeType.DO_WHILE_STATEMENT:
                return this._doWhileStatement(node as DoWhileStatement);
            case NodeType.FOR_STATEMENT:
                return this._forStatement(node as ForStatement);
            case NodeType.IF_STATEMENT:
                return this._ifStatement(node as IfStatement);
        }
    }

    private _variableStatement(statement: VariableStatement) {
        statement.declList.forEach((d) => {
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

    private _expressionStatement(statement: ExpressionStatement) {
        this._expression(statement.expression);
    }

    private _blockStatement(statement: BlockStatement) {
        statement.statements.forEach((s) => this._statement(s));
    }

    private _whileStatement(statement: WhileStatement) {
        const { block, jmp } = this._startLoop(statement.condition);
        this._statement(statement.body);
        this._endLoop(block, jmp);
    }

    private _doWhileStatement(statement: DoWhileStatement) {
        const block = this._block();
        this._statement(statement.body);
        this._condition(statement.condition, block);
        this._currentBlock.control.prev.push(block);
        this._currentBlock.control.next.push(block);
    }

    private _forStatement(statement: ForStatement) {
        if (statement.expressions[0]) {
            this._expression(statement.expressions[0]);
        }

        const { block, jmp } = this._startLoop(statement.expressions[1]);
        this._statement(statement.body);
        if (statement.expressions[2]) {
            this._expression(statement.expressions[2]);
        }
        this._endLoop(block, jmp);
    }

    private _ifStatement(statement: IfStatement) {
        const fromBlock = this._currentBlock;
        const jmpIf = this._condition(statement.condition);

        const ifBlock = this._block(undefined, false, false);
        this._statement(statement.ifBody);
        const jmpElse = this._jump(null);

        const elseBlock = this._block(undefined, false, false);
        jmpIf.operands.jumpTarget = elseBlock;
        this._statement(statement.elseBody);

        const transitionElseToNext = this._currentBlock.instructions.length != 0;
        const nextBlock = transitionElseToNext
            ? this._block(undefined, false, false)
            : this._currentBlock;
        jmpElse.operands.jumpTarget = nextBlock;

        this._setupIfElseControl(fromBlock, ifBlock, elseBlock, nextBlock, transitionElseToNext);
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

    private _lhsExpression(expr: Expression) {
        // Dereference non-typecast expressions
        if (
            expr.type === NodeType.EXPRESSION &&
            (expr as OperatorExpression).operator != Operator.TYPECAST
        ) {
            const left = this._expression(expr);
            return `[${left}]`;
        }
        return this._expression(expr);
    }

    private _literal(expr: LiteralExpression) {
        switch (expr.type) {
            case LiteralType.INTEGER:
            case LiteralType.FLOAT:
            case LiteralType.STRING:
            case LiteralType.THIS:
                return expr.value;
            case LiteralType.BOOLEAN:
                return expr.value === 'true' ? '1' : '0';
            case LiteralType.NULL:
                return '0';
        }
    }

    private _identifier(expr: IdentifierExpression) {
        return expr.value;
    }

    // ================ Operators ================
    private _operatorExpression(expr: OperatorExpression) {
        switch (expr.operator) {
            case Operator.FUNCTION_CALL:
                return this._functionCall(expr);
            case Operator.INDEX:
                return this._index(expr);
            case Operator.TYPECAST:
                return this._typecast(expr);
            case Operator.ASSIGNMENT:
                return this._assignment(expr);
            case Operator.INCREMENT:
            case Operator.DECREMENT:
                return this._increment(expr);
            case Operator.NULL_COALESCING:
                return this._nullCoalescing(expr);
            case Operator.TERNARY:
                return this._ternary(expr);
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

    private _index(expr: OperatorExpression) {
        if (expr.operands[0].typeSpecifier.isPointerType()) {
            const left = this._expression(expr.operands[0]);
            const right = this._expression(expr.operands[1]);
            const temp = this._allocTemp(expr.operands[0].typeSpecifier);
            this._assign(temp, Operator.ADDITION, right, left);
            return `[${temp}]`;
        }
    }

    private _typecast(expr: OperatorExpression) {
        // Ignore references
        if (expr.operands[0].typeSpecifier.createReferenceType().equals(expr.typeSpecifier))
            return this._expression(expr.operands[0]);

        const right = this._expression(expr.operands[0]);
        const temp = this._allocTemp(expr.typeSpecifier);
        this._assign(temp, Operator.TYPECAST, right);
        return temp;
    }

    private _assignment(expr: OperatorExpression) {
        const left = this._lhsExpression(expr.operands[0]);
        const right = this._expression(expr.operands[1]);
        this._copy(left, right);
        return left;
    }

    private _increment(expr: OperatorExpression) {
        const operator =
            expr.operator === Operator.INCREMENT ? Operator.ADDITION : Operator.SUBTRACTION;
        switch (expr.operands.length) {
            // Prefix
            case 1: {
                const left = this._expression(expr.operands[0]);
                this._assign(left, operator, '1', left);
                return left;
            }
            // Postfix
            case 2: {
                const temp = this._allocTemp(expr.typeSpecifier);
                const left = this._expression(expr.operands[0]);
                this._copy(temp, left);
                this._assign(left, operator, '1', left);
                return temp;
            }
            default: {
                this.error(
                    `Invalid arity for operator '${expr.operator}'. ` +
                        `Expected 1 or 2, instead got '${expr.operands.length}'.`
                );
                return null;
            }
        }
    }

    private _nullCoalescing(expr: OperatorExpression) {
        const fromBlock = this._currentBlock;
        const temp = this._allocTemp(expr.typeSpecifier);
        const first = this._expression(expr.operands[0]);
        const jmpIf = this._condJump(null, Operator.EQUAL, '0', first);

        const ifBlock = this._block(undefined, false, false);
        this._copy(temp, first);
        const jmpElse = this._jump(null);

        const elseBlock = this._block(undefined, false, false);
        jmpIf.operands.jumpTarget = elseBlock;
        const second = this._expression(expr.operands[1]);
        this._copy(temp, second);

        const nextBlock = this._block(undefined, false, false);
        jmpElse.operands.jumpTarget = nextBlock;

        this._setupIfElseControl(fromBlock, ifBlock, elseBlock, nextBlock);

        return temp;
    }

    private _ternary(expr: OperatorExpression) {
        const temp = this._allocTemp(expr.typeSpecifier);
        const { jmp } = this._startLoop(expr.operands[0]);
        const trueExpr = this._expression(expr.operands[1]);
        this._copy(temp, trueExpr);
        const jmpElse = this._jump(null);
        jmp.operands.jumpTarget = this._block();
        const falseExpr = this._expression(expr.operands[2]);
        this._copy(temp, falseExpr);
        jmpElse.operands.jumpTarget = this._block();
        return temp;
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
        return name;
    }

    private _condition(expr: Expression, jmpBlock: InstructionBlock = null) {
        if (!expr) return null;

        const left = this._expression(expr);
        return this._condJump(jmpBlock, jmpBlock ? Operator.NOT_EQUAL : Operator.EQUAL, '0', left);
    }

    private _startLoop(expr: Expression) {
        const block = this._block();
        const jmp = this._condition(expr);
        return { block, jmp };
    }

    private _endLoop(startBlock: InstructionBlock, jmp: ConditionalJumpInstruction) {
        this._jump(startBlock);
        this._currentBlock.control.next.push(startBlock);
        startBlock.control.prev.push(this._currentBlock);
        if (jmp) {
            jmp.operands.jumpTarget = this._block();
        }
    }

    private _postProcessFunction() {
        let queue = [this._currentBlock];
        let visitedBlocks = Set<string>();

        while (queue.length > 0) {
            const block = queue.pop();
            if (visitedBlocks.contains(block.label)) continue;

            let nextLive = Set<string>();
            block.control.next.forEach((b) => (nextLive = nextLive.union(b.live)));

            for (let i = block.instructions.length - 1; i >= 0; i--) {
                let live = Set<string>(nextLive);
                const instruction = block.instructions[i];
                const read = instruction.getVariablesRead();
                const written = instruction.getVariablesWritten();

                live = live.subtract(written).union(read);
                instruction.live.in = live;
                instruction.live.out = nextLive;
                nextLive = live;
            }

            block.live = nextLive;

            visitedBlocks = visitedBlocks.add(block.label);
            queue.unshift(...block.control.prev);
        }
    }

    private _setupIfElseControl(
        fromBlock: InstructionBlock,
        ifBlock: InstructionBlock,
        elseBlock: InstructionBlock,
        nextBlock: InstructionBlock,
        transitionElseToNext: boolean = true
    ) {
        // Control Flow Graph
        fromBlock.control.next.push(ifBlock, elseBlock);
        ifBlock.control.prev.push(fromBlock);
        elseBlock.control.prev.push(fromBlock);

        ifBlock.control.next.push(nextBlock);
        nextBlock.control.prev.push(ifBlock);

        if (transitionElseToNext) {
            elseBlock.control.next.push(nextBlock);
            nextBlock.control.prev.push(elseBlock);
        }
    }
}
