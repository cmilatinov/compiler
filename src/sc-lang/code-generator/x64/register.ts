import { BaseTypeSpecifier } from '../../type/type-specifier';

export enum Register {
    RAX = 'rax',
    RBX = 'rbx',
    RCX = 'rcx',
    RDX = 'rdx',
    RSI = 'rsi',
    RDI = 'rdi',
    RBP = 'rbp',
    RSP = 'rsp',
    R8 = 'r8',
    R9 = 'r9',
    R10 = 'r10',
    R11 = 'r11',
    R12 = 'r12',
    R13 = 'r13',
    R14 = 'r14',
    R15 = 'r15',
    XMM0 = 'xmm0',
    XMM1 = 'xmm1',
    XMM2 = 'xmm2',
    XMM3 = 'xmm3',
    XMM4 = 'xmm4',
    XMM5 = 'xmm5',
    XMM6 = 'xmm6',
    XMM7 = 'xmm7',
    XMM8 = 'xmm8',
    XMM9 = 'xmm9',
    XMM10 = 'xmm10',
    XMM11 = 'xmm11',
    XMM12 = 'xmm12',
    XMM13 = 'xmm13',
    XMM14 = 'xmm14',
    XMM15 = 'xmm15'
}

export const REGISTER_SIZE = 8;

export const INTEGER_REGISTERS = [
    // Caller-Saved Registers
    Register.RDI,
    Register.RSI,
    Register.RDX,
    Register.RCX,
    Register.R8,
    Register.R9,
    Register.R10,
    Register.R11,

    // Callee-Saved Registers
    Register.RBX,
    Register.R12,
    Register.R13,
    Register.R14,
    Register.R15
];

export const INTEGER_PARAMETER_REGISTERS = [
    Register.RDI,
    Register.RSI,
    Register.RDX,
    Register.RCX,
    Register.R8,
    Register.R9
];

export const FLOATING_REGISTERS = [
    // Caller-Saved Registers
    Register.XMM0,
    Register.XMM1,
    Register.XMM2,
    Register.XMM3,
    Register.XMM4,
    Register.XMM5,
    Register.XMM6,
    Register.XMM7,

    // Extra registers in 64-bit mode
    Register.XMM8,
    Register.XMM9,
    Register.XMM10,
    Register.XMM11,
    Register.XMM12,
    Register.XMM13,
    Register.XMM14,
    Register.XMM15
];

export const FLOATING_PARAMETER_REGISTERS = [
    Register.XMM0,
    Register.XMM1,
    Register.XMM2,
    Register.XMM3,
    Register.XMM4,
    Register.XMM5,
    Register.XMM6,
    Register.XMM7
];

export class RegisterAllocatorSCLang {
    private _registerMap: { [key: string]: string } = {};

    allocate(identifier: string, type: BaseTypeSpecifier) {
        const registerBank = type.isIntegerType() ? INTEGER_REGISTERS : FLOATING_REGISTERS;
        const register = registerBank.find((r) => !this._registerMap[r]);
        if (register) this._registerMap[register] = identifier;
        return register || null;
    }

    free(register: string) {
        delete this._registerMap[register];
    }

    clear() {
        this._registerMap = {};
    }

    getAllocatedIdentifier(register: string) {
        return this._registerMap[register] || null;
    }
}
