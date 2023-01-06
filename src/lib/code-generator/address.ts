import _ from 'lodash';

export enum AddressType {
    REGISTER = 0,
    STACK = 1,
    MEMORY = 2
}

export interface Address {
    type: AddressType;
    size: number;
    register?: string;
    stackOffset?: number;
    equals(addr: Address): boolean;
    toString(): string;
}

export function addressEquals(first: Address, second: Address) {
    return _.isEqual(first, second);
}
