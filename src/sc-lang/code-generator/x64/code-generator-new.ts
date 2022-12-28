import { CodeGeneratorASM } from '../../../lib/code-generator';
import { PipelineStage } from '../../../lib/pipeline';
import { SymbolTable } from '../../../lib/symbol-table';
import {
    AssignmentInstruction,
    BaseInstructionTAC,
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
    SymbolTableEntryType,
    VariableType
} from '../../symbol-table/symbol-table-entries';
import { Register, REGISTER_SIZE, RegisterAllocatorSCLang } from './register';
import { BaseTypeSpecifier } from '../../type/type-specifier';
import { InstructionX64 } from './instruction';
import { Operator } from '../../operator/operators';

type AddressMap = { [key: string]: Address };

export interface CodeGenerationContext {
    symbolTable: SymbolTable;
    readonly addressMap: AddressMap;
    readonly registerAllocator: RegisterAllocatorSCLang;
    stackOffset?: number;
}

export class CodeGeneratorSCLangX64New extends CodeGeneratorASM implements PipelineStage {
    private _symbolTable: SymbolTable;
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
        codeBlocks.forEach((b) => this._block(b));
    }

    // ================ Address Allocation ================
    private _assignAddress(identifier: string, address: Address) {
        this._context.addressMap[identifier] = address;
    }

    private _freeAddress(identifier: string) {
        const addr = this._address(identifier);
        if (addr && addr.type === AddressType.REGISTER) {
            this._context.registerAllocator.free(addr.register);
        }
        // delete this._currentAddressMap[identifier];
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
            register: this._context.registerAllocator.allocate(identifier, type),
            size
        };
    }

    private _allocate(): Address {
        return null;
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
        const instructionMap = {
            [Operator.LOGICAL_NOT]: [],
            [Operator.BITWISE_NOT]: [],
            [Operator.ADDITION]: [null, InstructionX64.ADD],
            [Operator.SUBTRACTION]: [InstructionX64.NEG, InstructionX64.SUB],
            [Operator.MULTIPLICATION]: [null, InstructionX64.IMULQ],
            [Operator.DIVISION]: [null, InstructionX64.IDIVQ],
            [Operator.REMAINDER]: [null, InstructionX64.IDIVQ],
            [Operator.LEFT_SHIFT]: [null, InstructionX64.SHL],
            [Operator.RIGHT_SHIFT]: [null, InstructionX64.SHR],
            [Operator.LESS_THAN]: [null],
            [Operator.GREATER_THAN]: [],
            [Operator.LESS_THAN_EQUAL]: [],
            [Operator.GREATER_THAN_EQUAL]: [],
            [Operator.EQUAL]: [],
            [Operator.NOT_EQUAL]: []
        };
    }

    private _copy(instruction: CopyInstruction) {}

    private _condJump(instruction: ConditionalJumpInstruction) {}

    private _jump(instruction: JumpInstruction) {
        this._instruction(InstructionX64.JMP, instruction.operands.jumpTarget.label);
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
        this._paramList(entry);
        this._instructionLabelled(entry.name, InstructionX64.ENDBR64);
        this._stackFrameInit();
    }

    private _endFunction(instruction: EndFunctionInstruction) {
        this._stackFrameEnd();
        this._instruction(InstructionX64.RET);
        this._context.symbolTable = this._context.symbolTable.getParentTable() || this._symbolTable;
    }

    // ================ Helper Functions ================
    private _typeSize(type: BaseTypeSpecifier) {
        if (type.getVariableType() !== VariableType.CLASS) {
            return REGISTER_SIZE;
        }
        // TODO: Lookup symbol table for class types
        return 0;
    }

    private _paramList(entry: FunctionEntry) {
        let integerParamCounter = 0;
        let floatingParamCounter = 0;
        this._context.stackOffset = -REGISTER_SIZE; // RBP is last on stack
        entry.parameters.forEach((p) => {
            p.varType = p.typeSpecifier.getVariableType();
            let address: Address;
            if ([VariableType.INTEGER, VariableType.FLOATING].includes(p.varType)) {
                address = this._allocateRegister(p.name, p.typeSpecifier);

                if (p.varType === VariableType.INTEGER) integerParamCounter++;
                else floatingParamCounter++;
            } else {
                address = this._allocateStack(p.typeSpecifier);
            }
            this._assignAddress(p.name, address);
            // TODO: Handle reference types as absolute addresses
        });
    }

    private _stackFrameInit() {
        this._instruction(InstructionX64.PUSH, Register.RBP);
        this._instruction(InstructionX64.MOV, Register.RBP, Register.RSP);
    }

    private _stackFrameEnd() {
        this._instruction(InstructionX64.POP, Register.RBP);
    }

    private _address(variable: string): Address {
        const addr = this._context.addressMap[variable];
        return addr || null;
    }

    private _type(variable: string): BaseTypeSpecifier {
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

    private _asmRegisterAbsAddr(address: Address) {
        return `${this._asmPtr(address.size)} [${address.register}]`;
    }

    private _asmRegisterAddr(address: Address) {
        return address.register;
    }

    private _asmAddr(address: Address) {
        switch (address.type) {
            case AddressType.STACK:
                return this._asmStackAddr(address);
            case AddressType.REGISTER:
                return this._asmRegisterAddr(address);
            case AddressType.REGISTER_ABSOLUTE:
                return this._asmRegisterAbsAddr(address);
            default:
                this.error(`Invalid address type '${address.type}'!`);
                return '';
        }
    }

    private _mov(dest: string, src: string) {
        const destAddr = this._address(dest);
        const srcAddr = this._address(src);
        if (destAddr.size !== srcAddr.size) {
            this.error(`Incompatible address sizes (${destAddr.size} != ${srcAddr.size})!`);
            return;
        }
    }

    private __addi(dest: string, src: string) {
        const destAddr = this._address(dest);
        const srcAddr = this._address(src);
        if (destAddr.type === AddressType.REGISTER || srcAddr.type === AddressType.REGISTER) {
            this._instruction(InstructionX64.ADD, this._asmAddr(destAddr), this._asmAddr(srcAddr));
        } else {
            const tempAddr = this._allocateRegister(src, this._type(src));
            // this._mov;
        }
    }

    private _addi(dest: string, first: string, second: string) {
        if (first === dest) {
            this.__addi(dest, second);
        } else if (second === dest) {
            this.__addi(dest, first);
        } else {
            this._mov(dest, first);
            this.__addi(dest, second);
        }
    }

    private __addf(dest: string, src: string) {}

    private _addf(dest: string, first: string, second: string) {}

    private _add(dest: string, first: string, second: string) {
        const type = this._type(dest);
        if (type.isIntegerType()) {
            this._addi(dest, first, second);
        } else if (type.isFloatingType()) {
            // this._addf();
        }
    }

    // ================ Getters ================
    public get ctx() {
        return this._context;
    }
}
