import { Address, AddressType, CodeGeneratorASM } from '../../../lib/code-generator';
import { PipelineStage } from '../../../lib/pipeline';
import { SymbolTable } from '../../../lib/symbol-table';
import {
    AssignmentInstruction,
    BaseInstructionTAC,
    ConditionalJumpInstruction,
    CopyInstruction,
    EndFunctionInstruction,
    ExternInstruction,
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
    FLOATING_RETURN_REGISTER,
    INTEGER_PARAMETER_REGISTERS,
    INTEGER_REGISTERS,
    INTEGER_RETURN_REGISTER,
    isFloatingRegister,
    Register,
    REGISTER_SIZE,
    RegisterAllocatorSCLang
} from './register';
import {
    BaseTypeSpecifier,
    BOOLEAN_TYPE,
    BYTE_TYPE,
    DOUBLE_TYPE,
    FLOAT_TYPE,
    INTEGER_TYPE,
    PrimitiveType,
    STRING_TYPE
} from '../../type/type-specifier';
import { InstructionX64 } from './instruction';
import { Operator } from '../../operator/operators';
import { FunctionArgument, OperatorDefinitionTable } from '../../operator/operator-definitions';
import {
    BooleanToken,
    DoubleStringToken,
    FloatToken,
    IntegerToken,
    SingleStringToken
} from '../../../lib/tokenizer';
import { OperatorImplementationsX64 } from './operator-implementations';
import {
    DirectMemoryAddressX64,
    ImmediateAddressX64,
    IndirectMemoryAddressX64,
    RegisterAddressX64,
    StackAddressX64
} from './address';
import { OrderedSet, Set } from 'immutable';
import _ from 'lodash';
import { ConstantGenerator } from './constant-generator';

interface AddressMap {
    [key: string]: Address[];
}

interface CodeGenerationContext {
    symbolTable: SymbolTable;
    readonly addressMap: AddressMap;
    readonly registerAllocator: RegisterAllocatorSCLang;
    parameterIndices: { [key: string]: number };
    instruction?: BaseInstructionTAC;
    stackOffset?: number;
    stackSize?: number;
}

type PreProcessFunction = () => void;
type PostProcessFunction = (returnValue: FunctionArgument, ...operands: FunctionArgument[]) => void;

interface AddressOptions {
    include?: BaseRegister[];
    exclude?: BaseRegister[];
    allowImmediate?: boolean;
}

interface AssignInstructionOptions {
    preprocess?: PreProcessFunction;
    postprocess?: PostProcessFunction;
    addresses?: {
        dest?: AddressOptions;
        src?: AddressOptions;
        ret?: AddressOptions;
    };
}

export class CodeGeneratorSCLangX64 extends CodeGeneratorASM implements PipelineStage {
    private _symbolTable: SymbolTable;
    private _opTable: OperatorDefinitionTable;
    private _constantGenerator: ConstantGenerator;
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
        this._constantGenerator = new ConstantGenerator();
        this._initContext(this._symbolTable);
        codeBlocks.forEach((b) => this._block(b));
        return (
            `default rel\n\nglobal main\n\n` +
            `section .text\n\n${this.code}\n\n` +
            `section .data\n\n${this._constantGenerator.code}`
        );
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
            this._context.registerAllocator.set(identifier, baseRegister(address.register));
        }
    }

    private _freeAddress(identifier: string, address: Address) {
        const addresses = this._context.addressMap[identifier] || [];
        const index = addresses.findIndex((a) => a.equals(address));
        if (index >= 0) {
            addresses.splice(index, 1);
        }
        if (address?.type === AddressType.REGISTER) {
            const register = baseRegister(address.register);
            const other = this._context.registerAllocator.getAllocatedIdentifier(register);
            if (other === identifier) {
                this._context.registerAllocator.free(register);
            }
        }
    }

    private _freeRegister(register: BaseRegister, zero: boolean = false) {
        const identifier = this._context.registerAllocator.getAllocatedIdentifier(register);
        if (identifier) {
            const oldAddr = (this._context.addressMap[identifier] || []).find(
                (a) => a.type === AddressType.REGISTER && baseRegister(a.register) === register
            );
            if (oldAddr) {
                this._freeAddress(identifier, oldAddr);
                const entry = this._context.symbolTable.lookup(identifier);
                const isTemp = entry?.type === SymbolTableEntryType.TEMPORARY;
                const isLive = this._context.instruction.live.in.contains(identifier);
                if (isLive) {
                    if (isTemp) {
                        const newAddr = this._load(identifier, undefined, [register]);
                        this.mov(newAddr, oldAddr);
                    } else {
                        this._store(identifier);
                    }
                }
            }
        }
        if (zero) {
            const reg = RegisterAddressX64.createFromBase(register, 8);
            this._clear(reg);
        }
    }

    private _load(
        identifier: string,
        included?: BaseRegister[],
        excluded?: BaseRegister[],
        isReturnValue: boolean = false,
        allowImmediate: boolean = false,
        assignOnly: boolean = false
    ): Address {
        // Identifier is already in a register
        let addr = this._address(identifier);
        if (addr && addr.type === AddressType.REGISTER) {
            const register = baseRegister(addr.register);
            const isIncluded = !included || included.includes(register);
            const isExcluded = excluded && excluded.includes(register);
            if (isIncluded && !isExcluded) {
                return addr;
            }
        }

        // Identifier info
        const isConstant = this._isConstant(identifier);
        const type = this._type(identifier);
        const size = this._typeSize(type);

        // Return immediate address for integer constants
        if (allowImmediate && isConstant && type.isIntegerType()) {
            return new ImmediateAddressX64(this._constantValue(identifier), size);
        }

        const priority = (register: BaseRegister) => {
            const identifier = this._context.registerAllocator.getAllocatedIdentifier(register);
            if (!identifier) return 1;
            const liveSets = this._context.instruction.live;
            const liveSet = isReturnValue ? liveSets.out : liveSets.in;
            if (!liveSet.contains(identifier)) return 0;
            if (this._isConstant(identifier)) return 2;
            if (this._isTemporary(identifier)) return 4;
            return 3;
        };

        // Find currently allocated dead value whose register we can use
        const register = OrderedSet<BaseRegister>(
            included ? included : this._context.registerAllocator.getRegisterBank(type)
        )
            .asMutable()
            .subtract(Set<BaseRegister>(excluded || []))
            .toArray()
            .sort((a, b) => priority(a) - priority(b))
            .shift();
        if (register) {
            this._freeRegister(register);
            const newAddr = RegisterAddressX64.createFromBase(register, size);
            this._assignAddress(identifier, newAddr);
            if (!assignOnly) {
                if (isConstant) {
                    if (size < REGISTER_SIZE) {
                        this._clear(RegisterAddressX64.createFromOther(newAddr, REGISTER_SIZE));
                    }
                    const value = this._constantValue(identifier);
                    const constant = this._constantGenerator.generate(type, size, value);
                    this.mov(newAddr, this._constantAddress(type, constant.label, size));
                } else if (addr) {
                    this.mov(newAddr, addr);
                }
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
            (a) => a.type === AddressType.REGISTER
        );
        const registerAddr = addresses[0][0];
        const memoryAddr = addresses[1][0];
        if (memoryAddr && registerAddr) {
            this.mov(memoryAddr, registerAddr);
            return registerAddr;
        }
        return registerAddr || null;
    }

    // ================ Instruction Processors ================
    private _block(block: InstructionBlock) {
        block.instructions.forEach((i) => this._instruction(i));
    }

    private _instruction(instruction: BaseInstructionTAC) {
        this._context.instruction = instruction;
        this._instructionComment(instruction);
        switch (instruction.type) {
            case InstructionTAC.ASSIGNMENT:
                this._assign(instruction as AssignmentInstruction);
                break;
            case InstructionTAC.COPY:
                this._copy(instruction as CopyInstruction);
                break;
            case InstructionTAC.CONDITIONAL_JUMP:
                this._condJump(instruction as ConditionalJumpInstruction);
                break;
            case InstructionTAC.JUMP:
                this._jump(instruction as JumpInstruction);
                break;
            case InstructionTAC.PARAMETER:
                this._param(instruction as ParameterInstruction);
                break;
            case InstructionTAC.PROCEDURE_CALL:
                this._call(instruction as ProcedureCallInstruction);
                break;
            case InstructionTAC.RETURN:
                this._return(instruction as ReturnInstruction);
                break;
            case InstructionTAC.FUNCTION:
                this._function(instruction as FunctionInstruction);
                break;
            case InstructionTAC.END_FUNCTION:
                this._endFunction(instruction as EndFunctionInstruction);
                break;
            case InstructionTAC.EXTERN:
                this._extern(instruction as ExternInstruction);
                break;
        }
        this.line();
    }

    private _instructionComment(instruction: BaseInstructionTAC) {
        this.comment(instruction.toString());
        const entries = Object.entries(this._context.registerAllocator['_registerMap']);
        if (entries.length > 0) {
            this.comment(`registers: [ ${entries.map(([k, v]) => `${k} = ${v}`).join(', ')} ]`);
        }
    }

    private _assignOptions(instruction: AssignmentInstruction): AssignInstructionOptions {
        const arity = instruction.operands.left ? 2 : 1;
        const operator = instruction.operands.operator;
        const floating =
            this._type(instruction.operands.right).getVariableClass() === VariableClass.FLOATING;
        switch (arity) {
            case 2:
                switch (operator) {
                    case Operator.MULTIPLICATION:
                        return {
                            preprocess: () => {
                                this._freeRegister(BaseRegister.A, true);
                                this._freeRegister(BaseRegister.D, false);
                            },
                            addresses: {
                                src: { exclude: [BaseRegister.A], allowImmediate: false },
                                dest: { include: [BaseRegister.A] }
                            }
                        };
                    case Operator.DIVISION:
                        return {
                            preprocess: () => {
                                this._freeRegister(BaseRegister.A);
                                this._freeRegister(BaseRegister.D, true);
                            },
                            addresses: {
                                src: {
                                    exclude: [BaseRegister.A, BaseRegister.D],
                                    allowImmediate: false
                                },
                                dest: {
                                    include: [BaseRegister.A]
                                }
                            }
                        };
                    case Operator.REMAINDER:
                        return {
                            preprocess: () => {
                                this._freeRegister(BaseRegister.A);
                                this._freeRegister(BaseRegister.D, true);
                            },
                            addresses: {
                                src: {
                                    exclude: [BaseRegister.A, BaseRegister.D],
                                    allowImmediate: false
                                },
                                dest: {
                                    include: [BaseRegister.A]
                                },
                                ret: {
                                    include: [BaseRegister.D]
                                }
                            }
                        };
                    case Operator.EQUAL:
                    case Operator.NOT_EQUAL:
                    case Operator.LESS_THAN:
                    case Operator.LESS_THAN_EQUAL:
                    case Operator.GREATER_THAN:
                    case Operator.GREATER_THAN_EQUAL:
                        if (floating) {
                            return {
                                addresses: {
                                    ret: {
                                        include: INTEGER_REGISTERS
                                    }
                                }
                            };
                        }
                }
                break;
            case 1:
                switch (operator) {
                }
                break;
        }
        return {
            addresses: {
                src: {
                    allowImmediate: true
                }
            }
        };
    }

    private _assign(instruction: AssignmentInstruction) {
        const operands = [];
        const dest = instruction.operands.left || instruction.operands.right;
        const src = instruction.operands.left ? instruction.operands.right : null;

        const options = this._assignOptions(instruction);
        options.preprocess?.call(this);

        const destOperand = {
            type: this._type(dest),
            address: this._load(
                dest,
                options.addresses?.dest?.include,
                options.addresses?.dest?.exclude,
                false,
                options.addresses?.dest?.allowImmediate
            )
        };
        operands.push(destOperand);

        let srcOperand: FunctionArgument;
        if (src) {
            srcOperand = {
                type: this._type(src),
                address: this._load(
                    src,
                    options.addresses?.src?.include,
                    options.addresses?.src?.include,
                    false,
                    options.addresses?.src?.allowImmediate
                ),
                identifier: src
            };
            operands.push(srcOperand);
        }

        this._freeAddress(dest, destOperand.address);

        const ret = instruction.operands.assignmentTarget;
        const returnType = this._type(ret);
        let returnAddr: Address;
        if (!options?.addresses?.ret && returnType.equals(destOperand.type)) {
            returnAddr = RegisterAddressX64.createFromOther(
                destOperand.address as RegisterAddressX64,
                this._typeSize(returnType)
            );
            this._assignAddress(instruction.operands.assignmentTarget, returnAddr);
        } else {
            returnAddr = this._load(
                ret,
                options?.addresses?.ret?.include,
                options?.addresses?.ret?.exclude,
                true,
                false,
                true
            );
        }
        const returnValue: FunctionArgument = {
            type: returnType,
            address: returnAddr,
            identifier: ret
        };

        options.postprocess?.call(this, returnValue, destOperand, srcOperand);

        const def = this._opTable.getExactDefinition(
            instruction.operands.operator as Operator,
            {},
            operands.map((o) => o.type),
            this._type(instruction.operands.assignmentTarget)
        );
        def?.implementation?.call(undefined, this, returnValue, ...operands);
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

    private _param(instruction: ParameterInstruction) {
        const param = instruction.operands.parameter;
        const type = this._type(param);
        const varClass = type.getVariableClass();
        let address: Address;
        switch (varClass) {
            case VariableClass.INTEGER:
            case VariableClass.FLOATING:
                const registerPool =
                    varClass === VariableClass.INTEGER
                        ? INTEGER_PARAMETER_REGISTERS
                        : FLOATING_PARAMETER_REGISTERS;
                const index = this._context.parameterIndices[varClass]++;
                const register = registerPool[index];
                if (register) {
                    address = this._load(param, [register]);
                } else {
                    const size = this._typeSize(type);
                    address = new StackAddressX64((this._context.stackOffset -= size), size);
                    this._context.stackSize += size;
                }
                break;
            case VariableClass.MEMORY:
                // TODO: Implement memory variables
                break;
        }
        // this._assignAddress(param, address);
    }

    private _call(instruction: ProcedureCallInstruction) {
        const label = instruction.getProcedureTargetLabel();
        INTEGER_PARAMETER_REGISTERS.slice()
            .concat(FLOATING_PARAMETER_REGISTERS.slice())
            .concat([INTEGER_RETURN_REGISTER])
            .forEach((r) => this._freeRegister(r));
        const nFloatParams = this._context.parameterIndices[VariableClass.FLOATING];
        if (this._isVararg(label)) {
            this._freeRegister(BaseRegister.A);
            this.mov(
                RegisterAddressX64.createFromRegister(Register.AL),
                new ImmediateAddressX64(nFloatParams.toString(), 1)
            );
        }
        const returnValue = instruction.operands.returnValueTarget;
        if (returnValue) {
            this._assignAddress(returnValue, this._returnValueAddress(returnValue));
        }
        this.instruction(InstructionX64.CALL, label);
        this._context.parameterIndices = {
            [VariableClass.INTEGER]: 0,
            [VariableClass.FLOATING]: 0
        };
    }

    private _return(instruction: ReturnInstruction) {
        const type = this._type(instruction.operands.value);
        const size = this._typeSize(type);

        let returnAddr: Address;
        let addr: Address;
        const varClass = type.getVariableClass();
        switch (varClass) {
            case VariableClass.INTEGER:
                this._freeRegister(BaseRegister.A);
                addr = this._load(instruction.operands.value, [BaseRegister.A]);
                returnAddr = RegisterAddressX64.createFromBase(BaseRegister.A, size);
                break;
            case VariableClass.FLOATING:
                this._freeRegister(BaseRegister.MM0);
                addr = this._load(instruction.operands.value, [BaseRegister.MM0]);
                returnAddr = RegisterAddressX64.createFromBase(BaseRegister.MM0, size);
                break;
        }

        this.mov(returnAddr, addr);
        this._stackFrameEnd();
        this.instruction(InstructionX64.RET);
    }

    private _function(instruction: FunctionInstruction) {
        const entry = this._context.symbolTable.lookup(
            instruction.operands.label,
            SymbolTableEntryType.FUNCTION
        ) as FunctionEntry;
        this._initContext(entry.symbolTable);
        this._localVarList(entry);
        this._stackFrameInit(entry.name);
        this._paramList(entry);
    }

    private _endFunction(instruction: EndFunctionInstruction) {
        this._stackFrameEnd();
        this._freeRegister(BaseRegister.A, true);

        this.instruction(InstructionX64.RET);
        this.line();
        this._context.symbolTable = this._context.symbolTable.getParentTable() || this._symbolTable;
    }

    private _extern(instruction: ExternInstruction) {
        this.instruction('extern', instruction.operands.name);
    }

    // ================ Helper Functions ================
    private _isConstant(identifier: string) {
        return [
            IntegerToken[0],
            FloatToken[0],
            BooleanToken[0],
            SingleStringToken[0],
            DoubleStringToken[0]
        ].some((r) => r.test(identifier));
    }

    private _isTemporary(identifier: string) {
        const entry = this._context.symbolTable.lookup(identifier);
        return entry.type === SymbolTableEntryType.TEMPORARY;
    }

    private _constantValue(constant: string) {
        const type = this._type(constant);
        if (!type.isPrimitiveType()) return '';

        switch (type.asType().value) {
            case PrimitiveType.INTEGER:
                return Math.round(Number(constant)).toString();
            case PrimitiveType.FLOAT:
                return Number(constant).toString();
            case PrimitiveType.BOOLEAN:
                return constant === 'true' ? '1' : '0';
            case PrimitiveType.STRING:
                return constant.substring(1, constant.length - 1);
        }
    }

    private _constantAddress(type: BaseTypeSpecifier, label: string, size: number) {
        if (type.equals(STRING_TYPE)) return new DirectMemoryAddressX64(label, size);
        return new IndirectMemoryAddressX64(label, size);
    }

    private _type(variable: string): BaseTypeSpecifier {
        if (FloatToken[0].test(variable)) return FLOAT_TYPE;
        if (IntegerToken[0].test(variable)) return INTEGER_TYPE;
        if (BooleanToken[0].test(variable)) return BOOLEAN_TYPE;
        if (SingleStringToken[0].test(variable) || DoubleStringToken[0].test(variable))
            return STRING_TYPE;
        return this._context.symbolTable.lookup(variable)?.['typeSpecifier'];
    }

    private _typeSize(type: BaseTypeSpecifier) {
        if (type.isPrimitiveType()) {
            if (type.equals(BOOLEAN_TYPE)) return 1;
            if (type.equals(BYTE_TYPE)) return 1;
            if (type.equals(STRING_TYPE)) return REGISTER_SIZE;
            if (type.equals(FLOAT_TYPE)) return 4;
            if (type.equals(INTEGER_TYPE)) return 4;
            if (type.equals(DOUBLE_TYPE)) return 8;
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
        this._context.stackSize = 0;
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
                this._context.stackSize += size;
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

    private _stackAlign(size: number) {
        return Math.ceil(size / 16) * 16;
    }

    private _stackFrameInit(label: string) {
        this.instructionLabelled(label, InstructionX64.PUSH, Register.RBP);
        this.instruction(InstructionX64.MOV, Register.RBP, Register.RSP);
        if (this._context.stackSize > 0) {
            this.instruction(
                InstructionX64.SUB,
                Register.RSP,
                this._stackAlign(this._context.stackSize).toString()
            );
        }
    }

    private _stackFrameEnd() {
        if (this._context.stackSize > 0) {
            this.instruction(
                InstructionX64.ADD,
                Register.RSP,
                this._stackAlign(this._context.stackSize).toString()
            );
        }
        this.instruction(InstructionX64.POP, Register.RBP);
    }

    private _returnValueAddress(identifier: string): Address {
        const type = this._type(identifier);
        const size = this._typeSize(type);
        switch (type.getVariableClass()) {
            case VariableClass.INTEGER:
                return RegisterAddressX64.createFromBase(INTEGER_RETURN_REGISTER, size);
            case VariableClass.FLOATING:
                return RegisterAddressX64.createFromBase(FLOATING_RETURN_REGISTER, size);
            case VariableClass.MEMORY:
                return new IndirectMemoryAddressX64(INTEGER_RETURN_REGISTER, size);
        }
    }

    private _address(variable: string): Address {
        const addresses = this._context.addressMap[variable] || [];
        return addresses[0] || null;
    }

    private _initContext(table: SymbolTable) {
        this._context = {
            symbolTable: table,
            addressMap: {},
            registerAllocator: new RegisterAllocatorSCLang(),
            parameterIndices: {
                [VariableClass.INTEGER]: 0,
                [VariableClass.FLOATING]: 0
            }
        };
    }

    private _isVararg(identifier: string) {
        const entry = this._context.symbolTable.lookup(identifier) as
            | LocalVariableEntry
            | FunctionEntry;
        const type = entry?.typeSpecifier;
        return (type?.isFunctionType() && type?.vararg) || false;
    }

    // ================ Assembly Instructions ================
    public mov(dest: Address, src: Address) {
        // TODO: Handle:
        //  - memory to memory moves
        //  - multi address moves
        //  - floating moves
        if (dest.equals(src)) return;
        const destFloating =
            dest.type === AddressType.REGISTER
                ? isFloatingRegister(dest.register as Register)
                : false;
        const srcFloating =
            src.type === AddressType.REGISTER
                ? isFloatingRegister(src.register as Register)
                : false;
        const instruction =
            srcFloating && destFloating
                ? InstructionX64.MOVQ
                : srcFloating || destFloating
                ? InstructionX64.MOVD
                : InstructionX64.MOV;
        if (
            (srcFloating || destFloating) &&
            dest instanceof RegisterAddressX64 &&
            src instanceof RegisterAddressX64
        ) {
            const size = Math.max(dest.size, src.size);
            dest = RegisterAddressX64.createFromOther(dest, size);
            src = RegisterAddressX64.createFromOther(src, size);
            this.instruction(instruction, dest.toString(), src.toString());
            return;
        }
        this.instruction(instruction, dest.toString(), src.toString());
    }

    private _clear(addr: Address) {
        if (addr.type !== AddressType.REGISTER) return;
        const floating = isFloatingRegister(addr.register as Register);
        const instruction = floating ? InstructionX64.XORPS : InstructionX64.XOR;
        this.instruction(instruction, addr.register, addr.register);
    }
}
