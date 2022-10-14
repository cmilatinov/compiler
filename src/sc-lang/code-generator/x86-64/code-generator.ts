import { CodeGenerator, LabelGenerator, RegisterAllocator } from '../../../lib/code-generator';
import { PipelineStage } from '../../../lib/pipeline';
import {
    FLOATING_PARAMETER_REGISTERS,
    FLOATING_REGISTERS,
    INTEGER_PARAMETER_REGISTERS,
    INTEGER_REGISTERS,
    Register,
    REGISTER_SIZE
} from './register';
import { Instruction } from './instruction';
import { ASTNode } from '../../../lib/ast/ast-node';
import * as ASTUtils from '../../../lib/ast/ast-utils';
import {
    BlockStatement,
    ExpressionStatement,
    FunctionDeclaration,
    IdentifierExpression,
    LiteralExpression,
    LiteralType,
    NodeType,
    OperatorExpression,
    VariableStatement
} from '../../ast/ast-types';
import {
    BaseTypeSpecifier,
    BOOLEAN_TYPE,
    FLOAT_TYPE,
    INTEGER_TYPE,
    PrimitiveType,
    TypeSpecifier
} from '../../type/type-specifier';
import { Address, AddressType } from '../../../lib/code-generator/address';
import { SymbolTable } from '../../../lib/symbol-table';
import {
    FunctionEntry,
    FunctionParameterEntry,
    SymbolTableEntryType,
    VariableType
} from '../../symbol-table/symbol-table-entries';
import { Operator } from '../../operator/operators';
import { ConstantGenerator } from './constant-generator';

export class CodeGeneratorX8664 extends CodeGenerator implements PipelineStage {
    private readonly _labelGen: LabelGenerator = new LabelGenerator();
    private readonly _constantGen: ConstantGenerator = new ConstantGenerator();
    private _symbolTable: SymbolTable;
    private _currentTable: SymbolTable;

    private _currentFunction: FunctionDeclaration;
    private _currentFunctionStack: (Address | null)[];
    private _intRegisterAlloc: RegisterAllocator;
    private _floatRegisterAlloc: RegisterAllocator;

    execute({ ast, symbolTable }: { ast: ASTNode; symbolTable: SymbolTable }): string {
        this._symbolTable = this._currentTable = symbolTable;
        this._traverse(ast);
        this._line();
        return this.code + this._constantGen.code;
    }

    // ================ Visitor Functions ================
    private _visitFunctionDeclaration(decl: FunctionDeclaration) {
        this._currentFunction = decl;
        this._currentTable = this._currentTable.lookup(
            decl.name,
            SymbolTableEntryType.FUNCTION
        )?.symbolTable;
        this._intRegisterAlloc = new RegisterAllocator(INTEGER_REGISTERS);
        this._floatRegisterAlloc = new RegisterAllocator(FLOATING_REGISTERS);

        this._functionInit(decl);
        decl.body.forEach((s) => this._statement(s));
        this._functionEnd();

        this._currentTable = this._currentTable.getParentTable() || this._symbolTable;
        this._currentFunction = undefined;
        this._intRegisterAlloc = this._floatRegisterAlloc = undefined;
    }

    // ================ Statement Functions ================
    private _statement(statement: ASTNode) {
        switch (statement.type) {
            case NodeType.VARIABLE_STATEMENT:
                return this._variableStatement(statement as VariableStatement);
            case NodeType.BLOCK_STATEMENT:
                return this._blockStatement(statement as BlockStatement);
            case NodeType.EXPRESSION_STATEMENT:
                return this._expressionStatement(statement as ExpressionStatement);
        }
    }

    private _blockStatement(statement: BlockStatement) {
        statement.statements.forEach((s) => this._statement(s));
    }

    private _variableStatement(statement: VariableStatement) {
        const stackSpace = statement.declList.reduce(
            (sum, d) => sum + this._typeSize(d.typeSpecifier),
            0
        );
        const address = this._stackAlloc(stackSpace);
        let stackOffset = address.stackOffset;
        statement.declList
            .slice()
            .reverse()
            .forEach((d) => {
                const symbol = this._currentTable.lookup(
                    d.name,
                    SymbolTableEntryType.LOCAL_VARIABLE
                );
                symbol.address = { ...address, stackOffset };
                stackOffset += this._typeSize(d.typeSpecifier);
            });
        statement.declList
            .filter((d) => !!d.variableInitializer)
            .forEach((d) => {
                this._stackFence();
                const addr = this._expression(d.variableInitializer.expression);
                const symbol = this._currentTable.lookup(
                    d.name,
                    SymbolTableEntryType.LOCAL_VARIABLE
                );
                this._move(addr, symbol.address);
                this._free(addr);
                this._stackCleanupFence();
            });
    }

    private _expressionStatement(statement: ExpressionStatement) {
        this._stackFence();
        this._free(this._expression(statement.expression));
        this._stackCleanupFence();
    }

    // ================ Statement Helper Functions ================
    private _expression(node: ASTNode): Address {
        if (node.type === NodeType.IDENTIFIER)
            return this._identifier(node as IdentifierExpression);
        if (Object.values<string>(LiteralType).includes(node.type))
            return this._literal(node as LiteralExpression);
        return this._operatorExpression(node as OperatorExpression);
    }

    private _identifier(identifier: IdentifierExpression): Address {
        return this._currentTable.lookup(identifier.value)?.address;
    }

    private _literal(literal: LiteralExpression): Address {
        switch (literal.type) {
            case LiteralType.INTEGER: {
                const addr = this._registerAlloc(
                    VariableType.INTEGER,
                    this._typeSize(INTEGER_TYPE)
                );
                const label = this._constantGen.generateNumber(literal.value);
                this._instruction(Instruction.MOV, addr.register, label);
                return addr;
            }
            case LiteralType.FLOAT: {
                const addr = this._registerAlloc(VariableType.FLOATING, this._typeSize(FLOAT_TYPE));
                const label = this._constantGen.generateNumber(literal.value);
                this._instruction(Instruction.MOV, addr.register, label);
                return addr;
            }
            case LiteralType.STRING: {
                const addr = this._registerAlloc();
                const label = this._constantGen.generateString(literal.value);
                this._instruction(Instruction.MOV, addr.register, label);
                return addr;
            }
        }
    }

    private _operatorExpression(expression: OperatorExpression): Address {
        return null;
    }

    private _operatorImplementation(
        operator: Operator,
        operands: { type: BaseTypeSpecifier; address: Address }[]
    ) {
        if (operands.every((o) => o.type.isPrimitiveType())) {
            switch (operator) {
                case Operator.ADDITION:
                    if (operands.length == 1) return operands[0].address;

                    return;
            }
        }
        return null;
    }

    private _operatorUnary(
        operator: Operator,
        operand: { type: BaseTypeSpecifier; address: Address }
    ) {
        const varType = this._paramType(operand.type);
        const regAddress = this._loadInRegister(varType, operand.address);
        switch (varType) {
            case VariableType.INTEGER:
                switch (operator) {
                    case Operator.INCREMENT:
                        this._instruction(Instruction.INC, regAddress.register);
                        break;
                    case Operator.DECREMENT:
                        this._instruction(Instruction.DEC, regAddress.register);
                        break;
                    case Operator.UNARY_PLUS:
                        break;
                    case Operator.UNARY_MINUS:
                        this._instruction(Instruction.NEG, regAddress.register);
                        break;
                    case Operator.LOGICAL_NOT:
                        if (!operand.type.equals(BOOLEAN_TYPE)) {
                            this._instruction(Instruction.CMP, regAddress.register, '0');
                        // this._instruction(Instruction.SETE, )
                        }
                        this._instruction(
                            Instruction.NOT,
                            regAddress.register
                        );
                        break;
                    case Operator.BITWISE_NOT:
                        this._instruction(
                            Instruction.NOT,
                            regAddress.register
                        );
                        break;
                    case Operator.ADDRESS_OF:
                    case Operator.DEREFERENCE:
                }
                break;
            case VariableType.FLOATING:
                switch (operator) {
                    case Operator.INCREMENT:
                        const label = this._constantGen.generateNumber('1');
                        const one = this._registerAlloc(VariableType.FLOATING, REGISTER_SIZE);
                        this._instruction(Instruction.CVTSI2SD, one.register, `qword [${label}]`);
                        this._instruction(Instruction.ADDSD, regAddress.register, one.register);
                        this._free(one);
                        break;
                    case Operator.DECREMENT:
                    case Operator.UNARY_PLUS:
                        break;
                    case Operator.UNARY_MINUS:
                    case Operator.LOGICAL_NOT:
                    case Operator.BITWISE_NOT:
                    case Operator.ADDRESS_OF:
                    case Operator.DEREFERENCE:
                }
                break;
        }
    }

    // ================ Information Retrieval Functions ================
    private _paramType(type: BaseTypeSpecifier) {
        if (this._isIntegerType(type)) return VariableType.INTEGER;
        if (this._isFloatingType(type)) return VariableType.FLOATING;
        return VariableType.COMPLEX;
    }

    private _typeSize(type: BaseTypeSpecifier) {
        if (this._isIntegerType(type) || this._isFloatingType(type)) {
            return REGISTER_SIZE;
        }
        // TODO: Lookup symbol table for class types
        return 0;
    }

    private _returnValueAddress(decl: FunctionDeclaration): Address {
        const size = this._typeSize(decl.returnType);
        switch (this._paramType(decl.returnType)) {
            case VariableType.INTEGER:
                return {
                    type: AddressType.REGISTER,
                    register: Register.RAX,
                    size
                };
            case VariableType.FLOATING:
                return {
                    type: AddressType.REGISTER,
                    register: Register.XMM0,
                    size
                };
            case VariableType.COMPLEX:
                return {
                    type: AddressType.REGISTER_ABSOLUTE,
                    register: Register.RAX,
                    size
                };
        }
    }

    private _isIntegerType(type: BaseTypeSpecifier) {
        if (type.isPrimitiveType()) {
            const pType = type as TypeSpecifier;
            return pType.value === PrimitiveType.INTEGER || pType.value === PrimitiveType.BOOLEAN;
        }
        return type.isReferenceType() || type.isPointerType() || type.isFunctionType();
    }

    private _isFloatingType(type: BaseTypeSpecifier) {
        return type.isPrimitiveType() && (type as TypeSpecifier).value === PrimitiveType.FLOAT;
    }

    // ================ AST Traversal ================
    private _traverse(node: ASTNode) {
        this._visit(node);
        this._getChildren(node).forEach((c) => this._traverse(c));
        this._postVisit(node);
    }

    private _visit(node: ASTNode) {
        if (typeof this[`_visit${node.type}`] === 'function') {
            this[`_visit${node.type}`](node);
        }
    }

    private _postVisit(node: ASTNode) {
        if (typeof this[`_postVisit${node.type}`] === 'function') {
            this[`_postVisit${node.type}`](node);
        }
    }

    private _getChildren(node: ASTNode): ASTNode[] {
        return ASTUtils.getNodeChildren(node);
    }

    // ================ Helper Functions ================
    private _returnValue(decl: FunctionDeclaration) {
        const fn = this._currentTable.getParentEntry() as FunctionEntry;
        fn.returnAddress = this._returnValueAddress(decl);
    }

    private _paramList() {
        let integerParamCounter = 0;
        let floatingParamCounter = 0;
        let stackParamSizeOffset = 2 * REGISTER_SIZE; // Return address and RBP are last on stack
        this._currentTable
            .getEntries()
            .filter((e) => e.type === NodeType.PARAMETER)
            .map<FunctionParameterEntry>((e) => e as FunctionParameterEntry)
            .forEach((p) => {
                p.paramType = this._paramType(p.typeSpecifier);
                const size = this._typeSize(p.typeSpecifier);
                if (
                    p.paramType === VariableType.INTEGER &&
                    integerParamCounter < INTEGER_PARAMETER_REGISTERS.length
                ) {
                    p.address = {
                        type: AddressType.REGISTER,
                        register: INTEGER_PARAMETER_REGISTERS[integerParamCounter++],
                        size
                    };
                } else if (
                    p.paramType === VariableType.FLOATING &&
                    floatingParamCounter < FLOATING_PARAMETER_REGISTERS.length
                ) {
                    p.address = {
                        type: AddressType.REGISTER,
                        register: FLOATING_PARAMETER_REGISTERS[floatingParamCounter++],
                        size
                    };
                } else {
                    p.address = {
                        type: AddressType.STACK,
                        stackOffset: stackParamSizeOffset,
                        size
                    };
                    stackParamSizeOffset += p.address.size;
                }
                // TODO: Handle reference types as absolute addresses
            });
    }

    private _functionInit(decl: FunctionDeclaration) {
        this._paramList();
        this._instructionLabelled(decl.name, Instruction.ENDBR64);
        this._stackFrameInit();
    }

    private _functionEnd() {
        this._stackFrameEnd();
        this._instruction(Instruction.RET);
    }

    private _stackFrameInit() {
        this._instruction(Instruction.PUSH, Register.RBP);
        this._instruction(Instruction.MOV, Register.RBP, Register.RSP);
        this._currentFunctionStack = [];
    }

    private _stackFrameEnd() {
        this._stackCleanup();
        this._instruction(Instruction.POP, Register.RBP);
    }

    private _stackOffset() {
        return this._currentFunctionStack.find((s) => !!s)?.stackOffset || 0;
    }

    private _stackFence() {
        this._currentFunctionStack.push(null);
    }

    private _stackCleanupFence() {
        let addr: Address;
        const cleanup: Address[] = [];
        while ((addr = this._currentFunctionStack.pop())) {
            cleanup.push(addr);
        }
        if (cleanup.length > 0) {
            const size = cleanup.reduce((sum, addr) => sum + addr.size, 0);
            this._instruction(Instruction.ADD, Register.RSP, size.toString());
        }
    }

    private _stackCleanup() {
        const size = this._currentFunctionStack
            .filter((s) => !!s)
            .reduce((sum, addr) => sum + addr.size, 0);
        this._instruction(Instruction.ADD, Register.RSP, size.toString());
        this._currentFunctionStack = [];
    }

    private _alloc(type: BaseTypeSpecifier): Address {
        const size = this._typeSize(type);
        let addr = this._registerAlloc(this._paramType(type), size);
        if (addr) return addr;
        return this._stackAlloc(size);
    }

    private _free(address: Address) {
        if (address.register) {
            this._registerFree(address.register);
        }
    }

    private _stackAlloc(size: number): Address {
        this._instruction(Instruction.SUB, Register.RSP, size.toString());
        const addr = { type: AddressType.STACK, stackOffset: this._stackOffset() - size, size };
        this._currentFunctionStack.push(addr);
        return addr;
    }

    private _registerAllocInternal(allocator: RegisterAllocator, size: number): Address | null {
        const register = allocator.allocate();
        if (!register) return null;
        return { type: AddressType.REGISTER, register, size };
    }

    private _registerAlloc(
        type: VariableType = VariableType.INTEGER,
        size: number = REGISTER_SIZE
    ): Address | null {
        switch (type) {
            case VariableType.INTEGER:
                return this._registerAllocInternal(this._intRegisterAlloc, size);
            case VariableType.FLOATING:
                return this._registerAllocInternal(this._floatRegisterAlloc, size);
            default:
                return null;
        }
    }
    private _registerFree(register: string) {
        this._intRegisterAlloc.free(register);
        this._floatRegisterAlloc.free(register);
    }

    private _asmSize(size: number) {
        switch (size) {
            case 1:
                return 'byte';
            case 2:
                return 'word';
            case 4:
                return 'dword';
            case 8:
                return 'qword';
            default:
                return 'invalid';
        }
    }

    private _asmPtr(size: number) {
        return `${this._asmSize(size)} ptr`;
    }

    private _asmOffset(offset: number) {
        const sign = offset >= 0 ? '+' : '-';
        return ` ${sign} ${Math.abs(offset)}`;
    }

    private _asmStackAddr(address: Address) {
        if (this._stackOffset() === address.stackOffset) {
            return `${this._asmPtr(address.size)} [${Register.RSP}]`;
        }
        return `${this._asmPtr(address.size)} [${Register.RBP}${this._asmOffset(
            address.stackOffset
        )}]`;
    }

    private _asmRegisterAbsAddr(address: Address) {
        return `${this._asmPtr(address.size)} [${address.register}]`;
    }

    private _move(src: Address, dest: Address) {
        const size = Math.min(src.size, dest.size);
        if (src.size != dest.size) {
            this.error('Incompatible address sizes!');
            return;
        }

        switch (src.type) {
            case AddressType.REGISTER:
                switch (dest.type) {
                    case AddressType.REGISTER:
                        this._instruction(Instruction.MOV, dest.register, src.register);
                        break;
                    case AddressType.REGISTER_ABSOLUTE:
                        this._instruction(
                            Instruction.MOV,
                            this._asmRegisterAbsAddr(dest),
                            src.register
                        );
                        break;
                    case AddressType.STACK:
                        this._instruction(Instruction.MOV, this._asmStackAddr(dest), src.register);
                        break;
                    case AddressType.STACK_ABSOLUTE:
                        const address = this._registerAlloc(VariableType.INTEGER, REGISTER_SIZE);
                        this._instruction(
                            Instruction.MOV,
                            address.register,
                            this._asmStackAddr(dest)
                        );
                        this._instruction(
                            Instruction.MOV,
                            this._asmRegisterAbsAddr(address),
                            src.register
                        );
                        this._free(address);
                        break;
                }
                break;
            case AddressType.REGISTER_ABSOLUTE:
                switch (dest.type) {
                    case AddressType.REGISTER:
                        this._instruction(
                            Instruction.MOV,
                            dest.register,
                            `${this._asmPtr(size)} [${src.register}]`
                        );
                        break;
                    case AddressType.REGISTER_ABSOLUTE:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        // const address = this._registerAlloc(VariableType.INTEGER, REGISTER_SIZE);
                        // this._instruction(
                        //     Instruction.MOV,
                        //     address.register,
                        //     `qword ptr [${src.register}]`
                        // );
                        // this._instruction(
                        //     Instruction.MOV,
                        //     `qword ptr [${dest.register}]`,
                        //     address.register
                        // );
                        // this._free(address);
                        break;
                    case AddressType.STACK:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        break;
                    case AddressType.STACK_ABSOLUTE:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        break;
                }
                break;
            case AddressType.STACK:
                switch (dest.type) {
                    case AddressType.REGISTER:
                        this._instruction(Instruction.MOV, dest.register, this._asmStackAddr(src));
                        break;
                    case AddressType.REGISTER_ABSOLUTE:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        break;
                    case AddressType.STACK:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        break;
                    case AddressType.STACK_ABSOLUTE:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        break;
                }
                break;
            case AddressType.STACK_ABSOLUTE:
                switch (dest.type) {
                    case AddressType.REGISTER:
                        const address = this._registerAlloc(VariableType.INTEGER, REGISTER_SIZE);
                        this._instruction(
                            Instruction.MOV,
                            address.register,
                            this._asmStackAddr(src)
                        );
                        this._instruction(
                            Instruction.MOV,
                            dest.register,
                            this._asmRegisterAbsAddr(address)
                        );
                        this._free(address);
                        break;
                    case AddressType.REGISTER_ABSOLUTE:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        break;
                    case AddressType.STACK:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        break;
                    case AddressType.STACK_ABSOLUTE:
                        // TODO: Account for larger operand sizes (loop over size and transfer chunks)
                        break;
                }
                break;
        }
    }

    private _loadInRegister(type: VariableType, src: Address) {
        if (src.size > 8) {
            this.error('Attempting to load register with a value larger than 64 bits.');
            return null;
        }

        if (src.type === AddressType.REGISTER) {
            return src;
        }

        const address = this._registerAlloc(type, src.size);
        this._move(src, address);
        return address;
    }

    private _add(src: Address, dest: Address) {}

    private _sub(src: Address, dest: Address) {}

    private _mul(src: Address, dest: Address) {}

    private _div(src: Address, dest: Address) {}
}
