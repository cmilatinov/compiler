import { CodeGeneratorASM } from '../../../lib/code-generator';
import { PipelineStage } from '../../../lib/pipeline';
import { SymbolTable } from '../../../lib/symbol-table';
import {
    AssignmentInstruction,
    ConditionalJumpInstruction,
    CopyInstruction,
    EndFunctionInstruction,
    FunctionInstruction,
    InstructionBlock,
    InstructionTAC,
    JumpInstruction,
    ParameterInstruction,
    ProcedureCallInstruction,
    ReturnInstruction
} from '../../../lib/tac';
import { ASTNode } from '../../../lib/ast/ast-node';
import { Address, AddressType } from '../../../lib/code-generator/address';
import {
    FunctionEntry,
    LocalVariableEntry,
    SymbolTableEntryType,
    VariableClass
} from '../../symbol-table/symbol-table-entries';
import {
    Register,
    REGISTER_SIZE,
    RegisterAllocatorSCLang,
    INTEGER_PARAMETER_REGISTERS,
    FLOATING_PARAMETER_REGISTERS
} from './register';
import {
    BaseTypeSpecifier,
    BOOLEAN_TYPE,
    FLOAT_TYPE,
    INTEGER_TYPE
} from '../../type/type-specifier';
import { InstructionX64 } from './instruction';
import { Operator } from '../../operator/operators';
import { OperatorDefinitionTable } from '../../operator/operator-definitions';
import { BooleanToken, FloatToken, IntegerToken } from '../../../lib/tokenizer';
import { OperatorImplementationsX64 } from './operator-implementations';
import _, { add } from 'lodash';

interface AddressMap {
    [key: string]: Address[];
}

interface CodeGenerationContext {
    symbolTable: SymbolTable;
    readonly addressMap: AddressMap;
    readonly registerAllocator: RegisterAllocatorSCLang;
    stackOffset?: number;
}

export class CodeGeneratorSCLangX64 extends CodeGeneratorASM implements PipelineStage {
    private _symbolTable: SymbolTable;
    private _opTable: OperatorDefinitionTable;
    private _context: CodeGenerationContext;

    execute({
        ast,
        symbolTable,
        codeBlocks
    }: {
        ast: ASTNode;
        symbolTable: SymbolTable;
        codeBlocks: InstructionBlock[];
    }) {
        this._symbolTable = symbolTable;
        this._opTable = OperatorImplementationsX64.createOperatorTable(this._symbolTable);
        this._initContext(this._symbolTable);
        codeBlocks.forEach((b) => this._block(b));
    }

    // ================ Address Allocation ================
    private _assignAddress(identifier: string, address: Address) {
        let arr: Address[];
        if (!this._context.addressMap[identifier]) {
            arr = this._context.addressMap[identifier] = [address];
        } else {
            arr = this._context.addressMap[identifier];
            arr.push(address);
        }
        arr.sort((a, b) => a.type - b.type);
        if (address.type === AddressType.REGISTER) {
            this._context.registerAllocator.set(identifier, address.register);
        }
    }

    private _freeAddress(identifier: string, address: Address) {
        const addrs = this._context.addressMap[identifier];
        addrs.splice(addrs.indexOf(address), 1);
        if (address.type === AddressType.REGISTER) {
            this._context.registerAllocator.free(address.register);
        }
    }

    private _allocateStack(type: BaseTypeSpecifier): Address {
        const size = this._typeSize(type);
        return {
            type: AddressType.STACK,
            stackOffset: (this._context.stackOffset -= size),
            size
        };
    }

    private _allocateRegister(identifier: string, type: BaseTypeSpecifier): Address {
        const size = this._typeSize(type);
        const register = this._context.registerAllocator.allocate(identifier, type);
        if (!register) {
            // TODO: Spill another temporary to memory
        }
        return {
            type: AddressType.REGISTER,
            register,
            size
        };
    }

    private _load(identifier: string): Address {
        const type = this._type(identifier);
        const addr = this._address(identifier);
        if (!addr) {
        } else if (addr.type === AddressType.STACK) {
            this._assignAddress(identifier, this._allocateRegister(identifier, type));
        }
        return addr;
    }

    // ================ Instruction Processors ================
    private _block(block: InstructionBlock) {
        block.instructions.forEach((i) => {
            switch (i.type) {
                case InstructionTAC.ASSIGNMENT:
                    return this._assign(i as AssignmentInstruction);
                case InstructionTAC.COPY:
                    return this._copy(i as CopyInstruction);
                case InstructionTAC.CONDITIONAL_JUMP:
                    return this._condJump(i as ConditionalJumpInstruction);
                case InstructionTAC.JUMP:
                    return this._jump(i as JumpInstruction);
                case InstructionTAC.PARAMETER:
                    return this._param(i as ParameterInstruction);
                case InstructionTAC.PROCEDURE_CALL:
                    return this._call(i as ProcedureCallInstruction);
                case InstructionTAC.RETURN:
                    return this._return(i as ReturnInstruction);
                case InstructionTAC.FUNCTION:
                    return this._function(i as FunctionInstruction);
                case InstructionTAC.END_FUNCTION:
                    return this._endFunction(i as EndFunctionInstruction);
            }
        });
    }

    private _assign(instruction: AssignmentInstruction) {
        const rightType = this._type(instruction.operands.right);
        const returnValue = {
            type: this._type(instruction.operands.assignmentTarget),
            address: this._address(instruction.operands.assignmentTarget)
        };
        if (instruction.operands.left) {
            const leftType = this._type(instruction.operands.right);
            const [def] = this._opTable.getCandidateDefinitions(
                instruction.operands.operator as Operator,
                {},
                [leftType, rightType]
            );
            if (def?.implementation)
                def.implementation(
                    this,
                    returnValue,
                    { type: leftType, address: this._address(instruction.operands.left) },
                    { type: rightType, address: this._address(instruction.operands.right) }
                );
        } else {
            const [def] = this._opTable.getCandidateDefinitions(
                instruction.operands.operator as Operator,
                {},
                [rightType]
            );
            if (def?.implementation)
                def.implementation(this, returnValue, {
                    type: rightType,
                    address: this._address(instruction.operands.right)
                });
        }
    }

    private _copy(instruction: CopyInstruction) {
        this._mov(instruction.operands.dest, instruction.operands.src);
    }

    private _condJump(instruction: ConditionalJumpInstruction) {}

    private _jump(instruction: JumpInstruction) {
        this.instruction(InstructionX64.JMP, instruction.operands.jumpTarget.label);
    }

    private _param(instruction: ParameterInstruction) {}

    private _call(instruction: ProcedureCallInstruction) {}

    private _return(instruction: ReturnInstruction) {}

    private _function(instruction: FunctionInstruction) {
        const entry = this._context.symbolTable.lookup(
            instruction.operands.label,
            SymbolTableEntryType.FUNCTION
        ) as FunctionEntry;
        this._initContext(entry.symbolTable);
        this._localVarList(entry);
        this._paramList(entry);
        this.instructionLabelled(entry.name, InstructionX64.ENDBR64);
        this._stackFrameInit();
    }

    private _endFunction(instruction: EndFunctionInstruction) {
        this._stackFrameEnd();
        this.instruction(InstructionX64.RET);
        this._context.symbolTable = this._context.symbolTable.getParentTable() || this._symbolTable;
    }

    // ================ Helper Functions ================
    private _typeSize(type: BaseTypeSpecifier) {
        if (type.getVariableClass() !== VariableClass.MEMORY) {
            return REGISTER_SIZE;
        }
        // TODO: Lookup symbol table for class types
        return 0;
    }

    private _findRegister(registerPool: Register[]) {
        while (registerPool.length > 0) {
            const register = registerPool.shift();
            const identifier = this._context.registerAllocator.getAllocatedIdentifier(register);
            if (!identifier) return register;
        }
        return null;
    }

    private _localVarList(entry: FunctionEntry) {
        this._context.stackOffset = 0;
        entry.symbolTable
            .getEntries()
            .filter((e) => e.type === SymbolTableEntryType.LOCAL_VARIABLE)
            .forEach((e) => {
                const localVar = e as LocalVariableEntry;
                const size = this._typeSize(localVar.typeSpecifier);
                this._assignAddress(e.name, {
                    type: AddressType.STACK,
                    size,
                    stackOffset: (this._context.stackOffset -= size)
                });
            });
    }

    private _paramList(entry: FunctionEntry) {
        // https://www.ired.team/miscellaneous-reversing-forensics/windows-kernel-internals/linux-x64-calling-convention-stack-frame
        // https://refspecs.linuxfoundation.org/elf/x86_64-abi-0.99.pdf
        let stackOffsetRegParams = -Math.ceil(Math.abs(this._context.stackOffset) / 16) * 16;
        let stackOffsetMemParams = 16;
        const registers = {
            [VariableClass.INTEGER]: [...INTEGER_PARAMETER_REGISTERS],
            [VariableClass.FLOATING]: [...FLOATING_PARAMETER_REGISTERS]
        };
        entry.parameters.forEach((p) => {
            const varClass = p.typeSpecifier.getVariableClass();
            const size = this._typeSize(p.typeSpecifier);
            switch (varClass) {
                case VariableClass.INTEGER:
                case VariableClass.FLOATING: {
                    const register = this._findRegister(registers[varClass]);
                    if (register) {
                        this._assignAddress(p.name, {
                            type: AddressType.REGISTER,
                            size,
                            register
                        });
                        this._assignAddress(p.name, {
                            type: AddressType.STACK,
                            size,
                            stackOffset: (stackOffsetRegParams -= size)
                        });
                    } else {
                        this._assignAddress(p.name, {
                            type: AddressType.STACK,
                            size,
                            stackOffset: stackOffsetMemParams
                        });
                        stackOffsetMemParams += size;
                    }
                    break;
                }
                case VariableClass.MEMORY: {
                    this._assignAddress(p.name, {
                        type: AddressType.STACK,
                        size,
                        stackOffset: stackOffsetMemParams
                    });
                    stackOffsetMemParams += size;
                    break;
                }
            }
        });
    }

    private _stackFrameInit() {
        this.instruction(InstructionX64.PUSH, Register.RBP);
        this.instruction(InstructionX64.MOV, Register.RBP, Register.RSP);
    }

    private _stackFrameEnd() {
        this.instruction(InstructionX64.POP, Register.RBP);
    }

    private _address(variable: string): Address {
        const addrs = [...(this._context.addressMap[variable] || [])];
        addrs.sort((a, b) => a.type - b.type);
        return addrs[0] || null;
    }

    private _type(variable: string): BaseTypeSpecifier {
        if (IntegerToken[0].test(variable)) return INTEGER_TYPE;
        if (FloatToken[0].test(variable)) return FLOAT_TYPE;
        if (BooleanToken[0].test(variable)) return BOOLEAN_TYPE;
        return this._context.symbolTable.lookup(variable)?.['typeSpecifier'];
    }

    private _initContext(table: SymbolTable) {
        this._context = {
            symbolTable: table,
            addressMap: {},
            registerAllocator: new RegisterAllocatorSCLang()
        };
    }

    // ================ Assembly Instructions ================
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
                this.error(`Invalid ASM size ${size}!`);
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
        return `${this._asmPtr(address.size)} [${Register.RBP}${this._asmOffset(
            address.stackOffset
        )}]`;
    }

    private _asmMemoryAddr(address: Address) {
        return `${this._asmPtr(address.size)} [${address.register}]`;
    }

    private _asmRegisterAddr(address: Address) {
        return address.register;
    }

    public asmAddress(address: Address) {
        switch (address.type) {
            case AddressType.STACK:
                return this._asmStackAddr(address);
            case AddressType.REGISTER:
                return this._asmRegisterAddr(address);
            case AddressType.MEMORY:
                return this._asmMemoryAddr(address);
            default:
                this.error(`Invalid address type '${address.type}'!`);
                return '';
        }
    }

    private _mov(dest: string, src: string) {
        const destAddr = this._address(dest);
        const srcAddr = this._address(src);
        if (destAddr?.size !== srcAddr?.size) {
            this.error(`Incompatible address sizes (${destAddr.size} != ${srcAddr.size})!`);
            return;
        }
    }
}
