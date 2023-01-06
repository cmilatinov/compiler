import { BaseTypeSpecifier } from '../../type/type-specifier';

export enum BaseRegister {
    A = 'a',
    B = 'b',
    C = 'c',
    D = 'd',
    SI = 'si',
    DI = 'di',
    BP = 'bp',
    SP = 'sp',
    R8 = 'r8',
    R9 = 'r9',
    R10 = 'r10',
    R11 = 'r11',
    R12 = 'r12',
    R13 = 'r13',
    R14 = 'r14',
    R15 = 'r15',
    MM0 = 'mm0',
    MM1 = 'mm1',
    MM2 = 'mm2',
    MM3 = 'mm3',
    MM4 = 'mm4',
    MM5 = 'mm5',
    MM6 = 'mm6',
    MM7 = 'mm7',
    MM8 = 'mm8',
    MM9 = 'mm9',
    MM10 = 'mm10',
    MM11 = 'mm11',
    MM12 = 'mm12',
    MM13 = 'mm13',
    MM14 = 'mm14',
    MM15 = 'mm15'
}

export enum Register {
    RAX = 'rax',
    EAX = 'eax',
    AX = 'ax',
    AL = 'al',
    RBX = 'rbx',
    EBX = 'ebx',
    BX = 'bx',
    BL = 'bl',
    RCX = 'rcx',
    ECX = 'ecx',
    CX = 'cx',
    CL = 'cl',
    RDX = 'rdx',
    EDX = 'edx',
    DX = 'dx',
    DL = 'dl',
    RSI = 'rsi',
    ESI = 'esi',
    SI = 'si',
    SIL = 'sil',
    RDI = 'rdi',
    EDI = 'edi',
    DI = 'di',
    DIL = 'dil',
    RBP = 'rbp',
    EBP = 'ebp',
    BP = 'bp',
    BPL = 'bpl',
    RSP = 'rsp',
    ESP = 'esp',
    SP = 'sp',
    SPL = 'spl',
    R8 = 'r8',
    R8D = 'r8d',
    R8W = 'r8w',
    R8B = 'r8b',
    R9 = 'r9',
    R9D = 'r9d',
    R9W = 'r9w',
    R9B = 'r9b',
    R10 = 'r10',
    R10D = 'r10d',
    R10W = 'r10w',
    R10B = 'r10b',
    R11 = 'r11',
    R11D = 'r11d',
    R11W = 'r11w',
    R11B = 'r11b',
    R12 = 'r12',
    R12D = 'r12d',
    R12W = 'r12w',
    R12B = 'r12b',
    R13 = 'r13',
    R13D = 'r13d',
    R13W = 'r13w',
    R13B = 'r13b',
    R14 = 'r14',
    R14D = 'r14d',
    R14W = 'r14w',
    R14B = 'r14b',
    R15 = 'r15',
    R15D = 'r15d',
    R15W = 'r15w',
    R15B = 'r15b',
    XMM0 = 'xmm0',
    YMM0 = 'ymm0',
    ZMM0 = 'zmm0',
    XMM1 = 'xmm1',
    YMM1 = 'ymm1',
    ZMM1 = 'zmm1',
    XMM2 = 'xmm2',
    YMM2 = 'ymm2',
    ZMM2 = 'zmm2',
    XMM3 = 'xmm3',
    YMM3 = 'ymm3',
    ZMM3 = 'zmm3',
    XMM4 = 'xmm4',
    YMM4 = 'ymm4',
    ZMM4 = 'zmm4',
    XMM5 = 'xmm5',
    YMM5 = 'ymm5',
    ZMM5 = 'zmm5',
    XMM6 = 'xmm6',
    YMM6 = 'ymm6',
    ZMM6 = 'zmm6',
    XMM7 = 'xmm7',
    YMM7 = 'ymm7',
    ZMM7 = 'zmm7',
    XMM8 = 'xmm8',
    YMM8 = 'ymm8',
    ZMM8 = 'zmm8',
    XMM9 = 'xmm9',
    YMM9 = 'ymm9',
    ZMM9 = 'zmm9',
    XMM10 = 'xmm10',
    YMM10 = 'ymm10',
    ZMM10 = 'zmm10',
    XMM11 = 'xmm11',
    YMM11 = 'ymm11',
    ZMM11 = 'zmm11',
    XMM12 = 'xmm12',
    YMM12 = 'ymm12',
    ZMM12 = 'zmm12',
    XMM13 = 'xmm13',
    YMM13 = 'ymm13',
    ZMM13 = 'zmm13',
    XMM14 = 'xmm14',
    YMM14 = 'ymm14',
    ZMM14 = 'zmm14',
    XMM15 = 'xmm15',
    YMM15 = 'ymm15',
    ZMM15 = 'zmm15'
}

export const REGISTER_SIZE = 8;

export const INTEGER_REGISTERS = [
    // Caller-Saved Registers
    BaseRegister.DI,
    BaseRegister.SI,
    BaseRegister.D,
    BaseRegister.C,
    BaseRegister.R8,
    BaseRegister.R9,
    BaseRegister.R10,
    BaseRegister.R11,

    // Callee-Saved Registers
    BaseRegister.B,
    BaseRegister.R12,
    BaseRegister.R13,
    BaseRegister.R14,
    BaseRegister.R15
];

export const INTEGER_PARAMETER_REGISTERS = [
    BaseRegister.DI,
    BaseRegister.SI,
    BaseRegister.D,
    BaseRegister.C,
    BaseRegister.R8,
    BaseRegister.R9
];

export const FLOATING_REGISTERS = [
    // Caller-Saved Registers
    BaseRegister.MM0,
    BaseRegister.MM1,
    BaseRegister.MM2,
    BaseRegister.MM3,
    BaseRegister.MM4,
    BaseRegister.MM5,
    BaseRegister.MM6,
    BaseRegister.MM7,

    // Extra registers in 64-bit mode
    BaseRegister.MM8,
    BaseRegister.MM9,
    BaseRegister.MM10,
    BaseRegister.MM11,
    BaseRegister.MM12,
    BaseRegister.MM13,
    BaseRegister.MM14,
    BaseRegister.MM15
];

export const FLOATING_PARAMETER_REGISTERS = [
    BaseRegister.MM0,
    BaseRegister.MM1,
    BaseRegister.MM2,
    BaseRegister.MM3,
    BaseRegister.MM4,
    BaseRegister.MM5,
    BaseRegister.MM6,
    BaseRegister.MM7
];

const REGISTER_MAP = {
    [BaseRegister.A]: [Register.AL, Register.AX, Register.EAX, Register.RAX],
    [BaseRegister.B]: [Register.BL, Register.BX, Register.EBX, Register.RBX],
    [BaseRegister.C]: [Register.CL, Register.CX, Register.ECX, Register.RCX],
    [BaseRegister.D]: [Register.DL, Register.DX, Register.EDX, Register.RDX],
    [BaseRegister.SI]: [Register.SIL, Register.SI, Register.ESI, Register.RSI],
    [BaseRegister.DI]: [Register.DIL, Register.DI, Register.EDI, Register.RDI],
    [BaseRegister.BP]: [Register.BPL, Register.BP, Register.EBP, Register.RBP],
    [BaseRegister.SP]: [Register.SPL, Register.SP, Register.ESP, Register.RSP],
    [BaseRegister.R8]: [Register.R8B, Register.R8W, Register.R8D, Register.R8],
    [BaseRegister.R9]: [Register.R9B, Register.R9W, Register.R9D, Register.R9],
    [BaseRegister.R10]: [Register.R10B, Register.R10W, Register.R10D, Register.R10],
    [BaseRegister.R11]: [Register.R11B, Register.R11W, Register.R11D, Register.R11],
    [BaseRegister.R12]: [Register.R12B, Register.R12W, Register.R12D, Register.R12],
    [BaseRegister.R13]: [Register.R13B, Register.R13W, Register.R13D, Register.R13],
    [BaseRegister.R14]: [Register.R14B, Register.R14W, Register.R14D, Register.R14],
    [BaseRegister.R15]: [Register.R15B, Register.R15W, Register.R15D, Register.R15],
    [BaseRegister.MM0]: [Register.XMM0, Register.YMM0, Register.ZMM0],
    [BaseRegister.MM1]: [Register.XMM1, Register.YMM1, Register.ZMM1],
    [BaseRegister.MM2]: [Register.XMM2, Register.YMM2, Register.ZMM2],
    [BaseRegister.MM3]: [Register.XMM3, Register.YMM3, Register.ZMM3],
    [BaseRegister.MM4]: [Register.XMM4, Register.YMM4, Register.ZMM4],
    [BaseRegister.MM5]: [Register.XMM5, Register.YMM5, Register.ZMM5],
    [BaseRegister.MM6]: [Register.XMM6, Register.YMM6, Register.ZMM6],
    [BaseRegister.MM7]: [Register.XMM7, Register.YMM7, Register.ZMM7],
    [BaseRegister.MM8]: [Register.XMM8, Register.YMM8, Register.ZMM8],
    [BaseRegister.MM9]: [Register.XMM9, Register.YMM9, Register.ZMM9],
    [BaseRegister.MM10]: [Register.XMM10, Register.YMM10, Register.ZMM10],
    [BaseRegister.MM11]: [Register.XMM11, Register.YMM11, Register.ZMM11],
    [BaseRegister.MM12]: [Register.XMM12, Register.YMM12, Register.ZMM12],
    [BaseRegister.MM13]: [Register.XMM13, Register.YMM13, Register.ZMM13],
    [BaseRegister.MM14]: [Register.XMM14, Register.YMM14, Register.ZMM14],
    [BaseRegister.MM15]: [Register.XMM15, Register.YMM15, Register.ZMM15]
} as const;

const REVERSE_REGISTER_MAP = {
    [Register.RAX]: BaseRegister.A,
    [Register.EAX]: BaseRegister.A,
    [Register.AX]: BaseRegister.A,
    [Register.AL]: BaseRegister.A,

    [Register.RBX]: BaseRegister.B,
    [Register.EBX]: BaseRegister.B,
    [Register.BX]: BaseRegister.B,
    [Register.BL]: BaseRegister.B,

    [Register.RCX]: BaseRegister.C,
    [Register.ECX]: BaseRegister.C,
    [Register.CX]: BaseRegister.C,
    [Register.CL]: BaseRegister.C,

    [Register.RDX]: BaseRegister.D,
    [Register.EDX]: BaseRegister.D,
    [Register.DX]: BaseRegister.D,
    [Register.DL]: BaseRegister.D,

    [Register.RSI]: BaseRegister.SI,
    [Register.ESI]: BaseRegister.SI,
    [Register.SI]: BaseRegister.SI,
    [Register.SIL]: BaseRegister.SI,

    [Register.RDI]: BaseRegister.DI,
    [Register.EDI]: BaseRegister.DI,
    [Register.DI]: BaseRegister.DI,
    [Register.DIL]: BaseRegister.DI,

    [Register.RBP]: BaseRegister.BP,
    [Register.EBP]: BaseRegister.BP,
    [Register.BP]: BaseRegister.BP,
    [Register.BPL]: BaseRegister.BP,

    [Register.RSP]: BaseRegister.SP,
    [Register.ESP]: BaseRegister.SP,
    [Register.SP]: BaseRegister.SP,
    [Register.SPL]: BaseRegister.SP,

    [Register.R8]: BaseRegister.R8,
    [Register.R8D]: BaseRegister.R8,
    [Register.R8W]: BaseRegister.R8,
    [Register.R8B]: BaseRegister.R8,

    [Register.R9]: BaseRegister.R9,
    [Register.R9D]: BaseRegister.R9,
    [Register.R9W]: BaseRegister.R9,
    [Register.R9B]: BaseRegister.R9,

    [Register.R10]: BaseRegister.R10,
    [Register.R10D]: BaseRegister.R10,
    [Register.R10W]: BaseRegister.R10,
    [Register.R10B]: BaseRegister.R10,

    [Register.R11]: BaseRegister.R11,
    [Register.R11D]: BaseRegister.R11,
    [Register.R11W]: BaseRegister.R11,
    [Register.R11B]: BaseRegister.R11,

    [Register.R12]: BaseRegister.R12,
    [Register.R12D]: BaseRegister.R12,
    [Register.R12W]: BaseRegister.R12,
    [Register.R12B]: BaseRegister.R12,

    [Register.R13]: BaseRegister.R13,
    [Register.R13D]: BaseRegister.R13,
    [Register.R13W]: BaseRegister.R13,
    [Register.R13B]: BaseRegister.R13,

    [Register.R14]: BaseRegister.R14,
    [Register.R14D]: BaseRegister.R14,
    [Register.R14W]: BaseRegister.R14,
    [Register.R14B]: BaseRegister.R14,

    [Register.R15]: BaseRegister.R15,
    [Register.R15D]: BaseRegister.R15,
    [Register.R15W]: BaseRegister.R15,
    [Register.R15B]: BaseRegister.R15,

    [Register.XMM0]: BaseRegister.MM0,
    [Register.YMM0]: BaseRegister.MM0,
    [Register.ZMM0]: BaseRegister.MM0,

    [Register.XMM1]: BaseRegister.MM1,
    [Register.YMM1]: BaseRegister.MM1,
    [Register.ZMM1]: BaseRegister.MM1,

    [Register.XMM2]: BaseRegister.MM2,
    [Register.YMM2]: BaseRegister.MM2,
    [Register.ZMM2]: BaseRegister.MM2,

    [Register.XMM3]: BaseRegister.MM3,
    [Register.YMM3]: BaseRegister.MM3,
    [Register.ZMM3]: BaseRegister.MM3,

    [Register.XMM4]: BaseRegister.MM4,
    [Register.YMM4]: BaseRegister.MM4,
    [Register.ZMM4]: BaseRegister.MM4,

    [Register.XMM5]: BaseRegister.MM5,
    [Register.YMM5]: BaseRegister.MM5,
    [Register.ZMM5]: BaseRegister.MM5,

    [Register.XMM6]: BaseRegister.MM6,
    [Register.YMM6]: BaseRegister.MM6,
    [Register.ZMM6]: BaseRegister.MM6,

    [Register.XMM7]: BaseRegister.MM7,
    [Register.YMM7]: BaseRegister.MM7,
    [Register.ZMM7]: BaseRegister.MM7,

    [Register.XMM8]: BaseRegister.MM8,
    [Register.YMM8]: BaseRegister.MM8,
    [Register.ZMM8]: BaseRegister.MM8,

    [Register.XMM9]: BaseRegister.MM9,
    [Register.YMM9]: BaseRegister.MM9,
    [Register.ZMM9]: BaseRegister.MM9,

    [Register.XMM10]: BaseRegister.MM10,
    [Register.YMM10]: BaseRegister.MM10,
    [Register.ZMM10]: BaseRegister.MM10,

    [Register.XMM11]: BaseRegister.MM11,
    [Register.YMM11]: BaseRegister.MM11,
    [Register.ZMM11]: BaseRegister.MM11,

    [Register.XMM12]: BaseRegister.MM12,
    [Register.YMM12]: BaseRegister.MM12,
    [Register.ZMM12]: BaseRegister.MM12,

    [Register.XMM13]: BaseRegister.MM13,
    [Register.YMM13]: BaseRegister.MM13,
    [Register.ZMM13]: BaseRegister.MM13,

    [Register.XMM14]: BaseRegister.MM14,
    [Register.YMM14]: BaseRegister.MM14,
    [Register.ZMM14]: BaseRegister.MM14,

    [Register.XMM15]: BaseRegister.MM15,
    [Register.YMM15]: BaseRegister.MM15,
    [Register.ZMM15]: BaseRegister.MM15
} as const;

const BIT_POS = [
    0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8, 31, 27, 13, 23, 21, 19, 16, 7, 26, 12,
    18, 6, 11, 5, 10, 9
];

const MM_REGEX = /^mm[0-9]+$/;

export function sizedRegister(register: BaseRegister, size: number) {
    if (MM_REGEX.test(register)) {
        size >>= 4;
    }
    const bit = BIT_POS[((size & -size) * 0x077cb531) >> 27];
    return REGISTER_MAP[register][bit] || null;
}

export function baseRegister(register: Register) {
    return REVERSE_REGISTER_MAP[register];
}

export function registerSize(register: Register) {
    const base = baseRegister(register);
    const index = (REGISTER_MAP[base] as unknown as Register[]).indexOf(register);
    let size = Math.pow(2, index);
    if (MM_REGEX.test(register)) {
        size <<= 4;
    }
    return size;
}

export class RegisterAllocatorSCLang {
    private _registerMap: { [key: string]: string } = {};

    allocate(identifier: string, type: BaseTypeSpecifier) {
        const registerBank = type.isIntegerType() ? INTEGER_REGISTERS : FLOATING_REGISTERS;
        const register = registerBank.find((r) => !this._registerMap[r]);
        if (register) this._registerMap[register] = identifier;
        return register || null;
    }

    set(identifier: string, register: BaseRegister) {
        this._registerMap[register] = identifier;
    }

    free(register: BaseRegister) {
        delete this._registerMap[register];
    }

    getAllocatedIdentifier(register: BaseRegister) {
        return this._registerMap[register] || null;
    }

    getRegisterBank(type: BaseTypeSpecifier) {
        return type.isIntegerType() ? INTEGER_REGISTERS : FLOATING_REGISTERS;
    }
}
