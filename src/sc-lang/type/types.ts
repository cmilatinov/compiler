import { TypeSpecifier } from './type-specifier';

export const VOID_TYPE: TypeSpecifier = new TypeSpecifier('void');

export const VOID_PTR_TYPE: TypeSpecifier = new TypeSpecifier('void', undefined, undefined, 1);

export const BOOLEAN_TYPE: TypeSpecifier = new TypeSpecifier('boolean');

export const INTEGER_TYPE: TypeSpecifier = new TypeSpecifier('int');

export const FLOAT_TYPE: TypeSpecifier = new TypeSpecifier('float');

export const STRING_TYPE: TypeSpecifier = new TypeSpecifier('string');
