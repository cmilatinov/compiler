import { Address, AddressType } from '../../../lib/code-generator';
import { BaseRegister, Register, registerSize, sizedRegister } from './register';
import _ from 'lodash';

function asmSize(size: number) {
    return { 1: 'byte', 2: 'word', 4: 'dword', 8: 'qword' }[size] || '';
}

function asmOffset(offset: number) {
    const sign = Math.sign(offset);
    const value = Math.abs(offset);
    switch (sign) {
        case 0:
            return ``;
        case 1:
            return ` + ${value}`;
        case -1:
            return ` - ${value}`;
    }
}

export abstract class BaseAddressX64 implements Address {
    protected constructor(public readonly type: AddressType, public readonly size: number) {}

    public abstract equals(addr: Address): boolean;
    public abstract toString(): string;
}

export class RegisterAddressX64 extends BaseAddressX64 {
    protected constructor(public readonly register: Register, size: number) {
        super(AddressType.REGISTER, size);
    }

    public equals(other: Address) {
        if (!other || !(other instanceof RegisterAddressX64)) return false;

        const addr = other as RegisterAddressX64;
        return addr.register === this.register && addr.size === this.size;
    }

    public toString() {
        return this.register as string;
    }

    public static createFromBase(register: BaseRegister, size: number) {
        return new RegisterAddressX64(sizedRegister(register, size), size);
    }

    public static createFromRegister(register: Register) {
        return new RegisterAddressX64(register, registerSize(register));
    }
}

export class StackAddressX64 extends BaseAddressX64 {
    public constructor(public readonly stackOffset: number, size: number) {
        super(AddressType.STACK, size);
    }

    public equals(other: Address) {
        if (!other || !(other instanceof StackAddressX64)) return false;

        const addr = other as StackAddressX64;
        return addr.stackOffset === this.stackOffset && addr.size === this.size;
    }

    public toString() {
        return `${asmSize(this.size)} [${Register.RBP}${asmOffset(this.stackOffset)}]`;
    }
}

export class IndirectMemoryAddressX64 extends RegisterAddressX64 {
    public constructor(register: BaseRegister, size: number) {
        super(sizedRegister(register, 8), size);
    }

    public equals(other: Address) {
        if (!other || !(other instanceof IndirectMemoryAddressX64)) return false;

        const addr = other as IndirectMemoryAddressX64;
        return addr.register === this.register && addr.size === this.size;
    }

    public toString() {
        return `[${this.register}]`;
    }
}

export class DirectMemoryAddressX64 extends BaseAddressX64 {
    public constructor(public readonly memoryAddress: string, size: number) {
        super(AddressType.MEMORY, size);
    }

    public equals(other: Address) {
        if (!other || !(other instanceof DirectMemoryAddressX64)) return false;

        const addr = other as DirectMemoryAddressX64;
        return addr.memoryAddress === this.memoryAddress && addr.size === this.size;
    }

    public toString() {
        return this.memoryAddress;
    }
}

export interface MultiAddressX64Part {
    bitRange: [number, number];
    address: BaseAddressX64;
}

export class MultiAddressX64 extends BaseAddressX64 {
    public constructor(public readonly parts: MultiAddressX64Part[]) {
        const size = parts.reduce((acc, part) => acc + part.address.size, 0);
        super(AddressType.REGISTER, size);
    }

    public equals(other: Address) {
        if (!other || !(other instanceof MultiAddressX64)) return false;

        const addr = other as MultiAddressX64;
        if (this.parts.length != addr.parts.length) return false;

        return this.parts.every(
            (part, i) =>
                _.isEqual(addr.parts[i].bitRange, part.bitRange) &&
                addr.parts[i].address.equals(part.address)
        );
    }

    public toString() {
        return ``;
    }
}
