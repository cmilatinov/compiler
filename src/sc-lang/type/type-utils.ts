import _ from 'lodash';

import { BaseTypeSpecifier, FunctionTypeSpecifier, TypeSpecifier } from './type-specifier';

export function isFunctionType(type: BaseTypeSpecifier) {
    return type.type === 'FunctionTypeSpecifier';
}

export function isPointerType(type: BaseTypeSpecifier) {
    return !!(type as TypeSpecifier).arraySizes || !!(type as TypeSpecifier).pointerLevel;
}

export function isReferenceType(type: BaseTypeSpecifier) {
    return !!(type as TypeSpecifier).referenceLevel;
}

export function isClassType(type: BaseTypeSpecifier) {
    return !isFunctionType(type) && !isPointerType(type) && !isPrimitiveType(type);
}

export function isPrimitiveType(type: BaseTypeSpecifier) {
    if (isFunctionType(type) || isPointerType(type)) return false;
    return ['string', 'float', 'int', 'boolean'].includes((type as TypeSpecifier).value);
}

export function typeEquals(first: BaseTypeSpecifier, second: BaseTypeSpecifier) {
    return _.isEqual(first, second);
}

export function functionTypeEquals(first: FunctionTypeSpecifier, second: FunctionTypeSpecifier) {
    return _.isEqual(first.parameters, second.parameters);
}

export function stringifyType(type: TypeSpecifier) {
    return (
        type.value +
        (type.arraySizes || []).map((s) => `[${s}]`).join() +
        '*'.repeat(type.pointerLevel || 0) +
        '&'.repeat(type.referenceLevel || 0)
    );
}

export function stringifyFunctionType(type: FunctionTypeSpecifier) {
    return (
        `fn(${type.parameters.map((p) => p.toString()).join(', ')}) ` +
        `-> ${type.returnType.toString()}`
    );
}

export function canImplicitCast(src: BaseTypeSpecifier, dest: BaseTypeSpecifier) {
    const primitiveTypeCasts = {
        string: ['boolean'],
        boolean: ['int'],
        char: ['boolean', 'int', 'float'],
        int: ['boolean', 'float'],
        float: ['boolean']
    };
    if (isPrimitiveType(src) && isPrimitiveType(dest)) {
        const srcType = (src as TypeSpecifier).value;
        const destType = (dest as TypeSpecifier).value;
        return primitiveTypeCasts[srcType].includes(destType);
    }
    return false;
}

export function createPointerType(type: BaseTypeSpecifier) {
    if (isFunctionType(type)) throw new Error('Cannot create pointer to function type.');

    const typeSpec = type as TypeSpecifier;
    return new TypeSpecifier(
        typeSpec.value,
        typeSpec.location,
        typeSpec.arraySizes,
        typeSpec.pointerLevel ? typeSpec.pointerLevel + 1 : 1,
        typeSpec.referenceLevel
    );
}

export function createDereferencedType(type: BaseTypeSpecifier) {
    if (!isPointerType(type)) throw new Error('Cannot dereference a non-pointer type.');

    const typeSpec = type as TypeSpecifier;
    if (Array.isArray(typeSpec.arraySizes) && typeSpec.arraySizes.length > 0) {
        return new TypeSpecifier(
            typeSpec.value,
            typeSpec.location,
            typeSpec.arraySizes.slice(0, typeSpec.arraySizes.length - 1),
            typeSpec.pointerLevel,
            typeSpec.referenceLevel
        );
    }

    return new TypeSpecifier(
        typeSpec.value,
        typeSpec.location,
        typeSpec.arraySizes,
        typeSpec.pointerLevel - 1,
        typeSpec.referenceLevel
    );
}
