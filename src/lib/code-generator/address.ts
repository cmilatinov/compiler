export enum AddressType {
    REGISTER = 'register',
    REGISTER_ABSOLUTE = 'register_absolute',
    STACK = 'stack',
    STACK_ABSOLUTE = 'stack_absolute'
}

export interface Address {
    type: AddressType;
    size: number;
    register?: string;
    stackOffset?: number;
}
