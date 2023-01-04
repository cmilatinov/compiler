import { SourceLocation } from '../../lib/tokenizer';
import { BaseTypeSpecifier, TypeSpecifier } from '../type/type-specifier';
import { Operator } from './operators';

export interface BaseOptions {
    operator: Operator;
    location: SourceLocation;
}

export interface NewOptions extends BaseOptions {
    typeSpecifier: TypeSpecifier;
}

export interface MemberAccessOptions extends BaseOptions {
    identifier: string;
}

export interface TypecastOptions extends BaseOptions {
    typeSpecifier: BaseTypeSpecifier;
}
