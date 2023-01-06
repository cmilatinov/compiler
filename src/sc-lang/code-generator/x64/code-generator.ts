import { Address, AddressType, CodeGeneratorASM } from '../../../lib/code-generator';
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
import {
    FunctionEntry,
    LocalVariableEntry,
    SymbolTableEntryType,
    VariableClass
} from '../../symbol-table/symbol-table-entries';
import {
    BaseRegister,
    baseRegister,
    FLOATING_PARAMETER_REGISTERS,
    INTEGER_PARAMETER_REGISTERS,
    Register,
    RegisterAllocatorSCLang
} from './register';
import {
    BaseTypeSpecifier,
    BOOLEAN_TYPE,
    FLOAT_TYPE,
    INTEGER_TYPE
} from '../../type/type-specifier';
import { InstructionX64 } from './instruction';
import { Operator } from '../../operator/operators';
import { FunctionArgument, OperatorDefinitionTable } from '../../operator/operator-definitions';
import { BooleanToken, FloatToken, IntegerToken } from '../../../lib/tokenizer';
import { OperatorImplementationsX64 } from './operator-implementations';
import _ from 'lodash';
import { RegisterAddressX64, StackAddressX64 } from './address';
import { OrderedSet, Set } from 'immutable';

interface AddressMap {
    [key: string]: Address[];
}

interface CodeGenerationContext {
    symbolTable: SymbolTable;
    readonly addressMap: AddressMap;
    readonly registerAllocator: RegisterAllocatorSCLang;
    instruction?: BaseInstructionTAC;
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
        // noinspection JSMismatchedCollectionQueryUpdate
        let arr: Address[];
        if (!this._context.addressMap[identifier]) {
            arr = this._context.addressMap[identifier] = [address];
        } else {
            arr = this._context.addressMap[identifier];
            arr.push(address);
        }
        arr.sort((a, b) => a.type - b.type);
        if (address.type === AddressType.REGISTER) {
            this._context.registerAllocator.set(
                identifier,
                baseRegister(address.register as Register)
            );
        }
    }

    private _freeAddress(identifier: string, address: Address) {
        const addresses = this._context.addressMap[identifier] || [];
        const index = addresses.findIndex((a) => a.equals(address));
        if (index >= 0) {
            addresses.splice(index, 1);
        }
        if (address?.type === AddressType.REGISTER) {
            this._context.registerAllocator.free(baseRegister(address.register as Register));
        }
    }

    private _freeRegister(register: BaseRegister, zero: boolean = false) {
        const identifier = this._context.registerAllocator.getAllocatedIdentifier(register);
        if (identifier) {
            const oldAddr = (this._context.addressMap[identifier] || []).find(
                (a) =>
                    a.type === AddressType.REGISTER &&
                    baseRegister(a.register as Register) === register
            );
            if (oldAddr) {
                this._freeAddress(identifier, oldAddr);
                const entry = this._context.symbolTable.lookup(identifier);
                const isTemp = entry?.type === SymbolTableEntryType.TEMPORARY;
                const isLive = this._context.instruction.live.in.contains(identifier);
                if (isLive) {
                    if (isTemp) {
                        const newAddr = this._load(identifier, [], [register]);
                        this.mov(newAddr, oldAddr);
                    } else {
                        this._store(identifier);
                    }
                }
            }
        }
        if (zero) {
            const reg = RegisterAddressX64.createFromBase(register, 8);
            this.instruction(InstructionX64.XOR, reg.toString(), reg.toString());
        }
    }

    private _load(
        identifier: string,
        preferred: BaseRegister[] = [],
        excluded: BaseRegister[] = [],
        isReturnValue: boolean = false
    ): Address {
        // Identifier is already in a register
        let addr = this._address(identifier);
        if (addr && addr.type === AddressType.REGISTER) return addr;

        // Identifier info
        const isCompileTimeConstant = this._isConstant(identifier);
        const type = this._type(identifier);
        const size = this._typeSize(type);

        // Find currently allocated dead value whose register we can use
        let register = OrderedSet<BaseRegister>(
            preferred.concat(this._context.registerAllocator.getRegisterBank(type))
        )
            .asMutable()
            .subtract(Set<BaseRegister>(excluded))
            .find((r) => {
                const id = this._context.registerAllocator.getAllocatedIdentifier(r);
                if (!id) return true;
                const liveSets = this._context.instruction.live;
                const liveSet = isReturnValue ? liveSets.out : liveSets.in;
                return !id || !liveSet.contains(id);
            });
        if (register) {
            const otherIdentifier =
                this._context.registerAllocator.getAllocatedIdentifier(register);
            this._freeAddress(otherIdentifier, this._store(otherIdentifier));
            const newAddr = RegisterAddressX64.createFromBase(register, size);
            this._assignAddress(identifier, newAddr);
            if (isCompileTimeConstant) {
                this.instruction(InstructionX64.MOV, newAddr.register, identifier);
            } else if (addr) {
                this.mov(newAddr, addr);
            }
            return newAddr;
        }

        // Should never hit here
        return null;
    }

    private _store(identifier: string): Address {
        if (!identifier) return null;
        const addresses = _.partition(
            this._context.addressMap[identifier],
            (a) => a.type === AddressType.REGISTER && a.register === identifier
        );
        const registerAddr = addresses[0][0];
        const memoryAddr = addresses[1][0];
        if (memoryAddr && registerAddr) {
            this.mov(memoryAddr, registerAddr);
            return registerAddr;
        }
        return null;
    }

    // ================ Instruction Processors ================
    private _block(block: InstructionBlock) {
        block.instructions.forEach((i) => {
            this._context.instruction = i;
            this._instructionComment(i);
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
        const operator = instruction.operands.operator as Operator;
        const isMulOp = [Operator.MULTIPLICATION, Operator.DIVISION].includes(operator);
        if (isMulOp) {
            this._freeRegister(BaseRegister.A, true);
            this._freeRegister(BaseRegister.D, operator === Operator.DIVISION);
        }

        const operands = [];
        const types = [];

        if (instruction.operands.left) {
            const leftType = this._type(instruction.operands.left);
            const leftAddr = this._load(instruction.operands.left, isMulOp ? [BaseRegister.A] : []);
            types.push(leftType);
            operands.push({ type: leftType, address: leftAddr });
        }

        const rightType = this._type(instruction.operands.right);
        const rightAddr = this._load(instruction.operands.right);
        types.push(rightType);
        operands.push({ type: rightType, address: rightAddr });

        const returnValue: FunctionArgument = {
            type: this._type(instruction.operands.assignmentTarget),
            address: this._load(
                instruction.operands.assignmentTarget,
                isMulOp ? [BaseRegister.A] : [],
                [],
                true
            )
        };

        const [def] = this._opTable.getCandidateDefinitions(
            instruction.operands.operator as Operator,
            {},
            types
        );
        if (def?.implementation) {
            def.implementation(this, returnValue, ...operands);
        }
    }

    private _copy(instruction: CopyInstruction) {
        const dest = this._address(instruction.operands.dest);
        const src = this._load(instruction.operands.src);
        this.mov(dest, src);
        this._store(instruction.operands.dest);
    }

    private _condJump(instruction: ConditionalJumpInstruction) {}

    private _jump(instruction: JumpInstruction) {
        this.instruction(InstructionX64.JMP, instruction.operands.jumpTarget.label);
    }

    private _param(instruction: ParameterInstruction) {}

    private _call(instruction: ProcedureCallInstruction) {}

    private _return(instruction: ReturnInstruction) {
        const type = this._type(instruction.operands.value);

        let addr: Address;
        const varClass = type.getVariableClass();
        switch (varClass) {
            case VariableClass.INTEGER:
                this._freeRegister(BaseRegister.A);
                addr = this._load(instruction.operands.value, [BaseRegister.A]);
                break;
            case VariableClass.FLOATING:
                this._freeRegister(BaseRegister.MM0);
                addr = this._load(instruction.operands.value, [BaseRegister.MM0]);
                break;
        }

        this.mov(RegisterAddressX64.createFromRegister(addr.register as Register), addr);
    }

    private _function(instruction: FunctionInstruction) {
        const entry = this._context.symbolTable.lookup(
            instruction.operands.label,
            SymbolTableEntryType.FUNCTION
        ) as FunctionEntry;
        this._initContext(entry.symbolTable);
        this._stackFrameInit(entry.name);
        this._localVarList(entry);
        this._paramList(entry);
    }

    private _endFunction(instruction: EndFunctionInstruction) {
        this._stackFrameEnd();
        this.instruction(InstructionX64.RET);
        this.line();
        this._context.symbolTable = this._context.symbolTable.getParentTable() || this._symbolTable;
    }

    // ================ Helper Functions ================
    private _instructionComment(instruction: BaseInstructionTAC) {
        this.line();
        this.comment(instruction.toString());
        const entries = Object.entries(this._context.registerAllocator['_registerMap']);
        if (entries.length > 0) {
            this.comment(`registers: [ ${entries.map(([k, v]) => `${k} = ${v}`).join(', ')} ]`);
        }
    }

    private _isConstant(identifier: string) {
        return /^[0-9]/.test(identifier);
    }

    private _typeSize(type: BaseTypeSpecifier) {
        if (type.getVariableClass() !== VariableClass.MEMORY) {
            return 4;
        }
        // TODO: Lookup symbol table for class types
        return 0;
    }

    private _findRegister(registerPool: BaseRegister[]) {
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
                this._assignAddress(
                    e.name,
                    new StackAddressX64((this._context.stackOffset -= size), size)
                );
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
                        const registerAddr = RegisterAddressX64.createFromBase(register, size);
                        const stackAddr = new StackAddressX64((stackOffsetRegParams -= size), size);
                        this._assignAddress(p.name, registerAddr);
                        this._assignAddress(p.name, stackAddr);
                        this.mov(stackAddr, registerAddr);
                    } else {
                        this._assignAddress(
                            p.name,
                            new StackAddressX64(stackOffsetMemParams, size)
                        );
                        stackOffsetMemParams += size;
                    }
                    break;
                }
                case VariableClass.MEMORY: {
                    this._assignAddress(p.name, new StackAddressX64(stackOffsetMemParams, size));
                    stackOffsetMemParams += size;
                    break;
                }
            }
        });
    }

    private _stackFrameInit(label: string) {
        this.instructionLabelled(label, InstructionX64.PUSH, Register.RBP);
        this.instruction(InstructionX64.MOV, Register.RBP, Register.RSP);
    }

    private _stackFrameEnd() {
        this.instruction(InstructionX64.POP, Register.RBP);
    }

    private _address(variable: string): Address {
        const addresses = this._context.addressMap[variable] || [];
        return addresses[0] || null;
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
    public mov(dest: Address, src: Address) {
        // TODO: Handle:
        //  - memory to memory moves
        //  - multi address moves
        //  - floating moves
        if (dest.equals(src) || dest.size !== src.size) return;
        this.instruction(InstructionX64.MOV, dest.toString(), src.toString());
    }
}
