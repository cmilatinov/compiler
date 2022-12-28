import _ from 'lodash';
import { SourceLocation } from '../../lib/tokenizer';
import { VariableType } from '../symbol-table/symbol-table-entries';

export enum PrimitiveType {
    VOID = 'void',
    BOOLEAN = 'boolean',
    INTEGER = 'int',
    LONG = 'long',
    FLOAT = 'float',
    DOUBLE = 'double',
    STRING = 'string'
}

export enum TypeSpecifierType {
    TYPE = 'TypeSpecifier',
    FUNCTION_TYPE = 'FunctionTypeSpecifier'
}

export abstract class BaseTypeSpecifier {
    public readonly type: TypeSpecifierType;
    public readonly location?: SourceLocation;

    protected constructor(type: TypeSpecifierType, location?: SourceLocation) {
        this.type = type;
        this.location = location;
    }

    public abstract equals(other: any): boolean;

    public abstract toString(): string;

    public isFunctionType() {
        return this.type === TypeSpecifierType.FUNCTION_TYPE;
    }

    public isPointerType() {
        return (
            !!(this as unknown as TypeSpecifier).arraySizes ||
            !!(this as unknown as TypeSpecifier).pointerLevel
        );
    }

    public isReferenceType() {
        return !!(this as unknown as TypeSpecifier).referenceLevel;
    }

    public isPrimitiveType() {
        if (this.isFunctionType() || this.isPointerType() || this.isReferenceType()) return false;
        return Object.values<string>(PrimitiveType).includes(
            (this as unknown as TypeSpecifier).value
        );
    }

    public isClassType() {
        return !this.isFunctionType() && !this.isPointerType() && !this.isPrimitiveType();
    }

    public isReferenceTypeOf(type: BaseTypeSpecifier) {
        return this.isReferenceType() && this.createUnreferencedType().equals(type);
    }

    public isIntegerType() {
        if (this.isPrimitiveType()) {
            const pType = this as unknown as TypeSpecifier;
            return pType.value === PrimitiveType.INTEGER || pType.value === PrimitiveType.BOOLEAN;
        }
        return this.isReferenceType() || this.isPointerType() || this.isFunctionType();
    }

    public isFloatingType() {
        return (
            this.isPrimitiveType() &&
            (this as unknown as TypeSpecifier).value === PrimitiveType.FLOAT
        );
    }

    public getVariableType() {
        if (this.isIntegerType()) return VariableType.INTEGER;
        if (this.isFloatingType()) return VariableType.FLOATING;
        return VariableType.CLASS;
    }

    public canImplicitCast(dest: BaseTypeSpecifier) {
        const primitiveTypeCasts = {
            [PrimitiveType.STRING]: [PrimitiveType.BOOLEAN],
            [PrimitiveType.BOOLEAN]: [PrimitiveType.INTEGER],
            [PrimitiveType.INTEGER]: [PrimitiveType.BOOLEAN, PrimitiveType.FLOAT],
            [PrimitiveType.FLOAT]: [PrimitiveType.BOOLEAN]
        };
        if (this.isPrimitiveType() && dest.isPrimitiveType()) {
            const srcType = (this as unknown as TypeSpecifier).value;
            const destType = (dest as TypeSpecifier).value;
            return primitiveTypeCasts[srcType].includes(destType);
        }
        // Void pointer to any other pointer
        if (this.equals(VOID_PTR_TYPE) && dest.isPointerType()) return true;

        if (this.isPointerType() && dest.isPointerType()) {
            return;
        }
        return false;
    }

    public createPointerType() {
        if (this.isFunctionType()) throw new Error('Cannot create pointer to function type.');

        const typeSpec = this as unknown as TypeSpecifier;
        return new TypeSpecifier(
            typeSpec.value,
            typeSpec.location,
            typeSpec.arraySizes,
            typeSpec.pointerLevel ? typeSpec.pointerLevel + 1 : 1,
            typeSpec.referenceLevel
        );
    }

    public createDereferencedType() {
        if (!this.isPointerType()) throw new Error('Cannot dereference a non-pointer type.');

        const typeSpec = this as unknown as TypeSpecifier;
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

    public createReferenceType() {
        if (this.isReferenceType())
            throw new Error('Cannot create reference type from a reference type.');

        const typeSpec = this as unknown as TypeSpecifier;
        return new TypeSpecifier(
            typeSpec.value,
            typeSpec.location,
            typeSpec.arraySizes,
            typeSpec.pointerLevel,
            1
        );
    }

    public createUnreferencedType() {
        if (!this.isReferenceType())
            throw new Error('Cannot create unreferenced type from a non-reference type.');

        const typeSpec = this as unknown as TypeSpecifier;
        return new TypeSpecifier(
            typeSpec.value,
            typeSpec.location,
            typeSpec.arraySizes,
            typeSpec.pointerLevel,
            typeSpec.referenceLevel - 1
        );
    }
}

export class TypeSpecifier extends BaseTypeSpecifier {
    public readonly value: string;
    public readonly arraySizes?: number[];
    public readonly pointerLevel?: number;
    public readonly referenceLevel?: number;

    constructor(
        value: string,
        location?: SourceLocation,
        arraySizes?: number[],
        pointerLevel?: number,
        referenceLevel?: number
    ) {
        super(TypeSpecifierType.TYPE, location);
        this.value = value;
        this.arraySizes =
            Array.isArray(arraySizes) && arraySizes.length > 0 ? arraySizes : undefined;
        this.pointerLevel = pointerLevel || undefined;
        this.referenceLevel = referenceLevel || undefined;
    }

    public equals(other: any) {
        if (!other || !(other instanceof TypeSpecifier)) return false;
        const { location: l1, ...first } = this;
        const { location: l2, ...second } = other as TypeSpecifier;
        return _.isEqual(first, second);
    }

    public toString() {
        return (
            this.value +
            (this.arraySizes || []).map((s) => `[${s}]`).join() +
            '*'.repeat(this.pointerLevel || 0) +
            '&'.repeat(this.referenceLevel || 0)
        );
    }

    public static fromObject(obj: any) {
        return new TypeSpecifier(
            obj.value,
            obj.location,
            obj.arraySizes,
            obj.pointerLevel,
            obj.referenceLevel
        );
    }
}

export class FunctionTypeSpecifier extends BaseTypeSpecifier {
    public readonly parameters: BaseTypeSpecifier[];
    public readonly returnType: BaseTypeSpecifier;

    constructor(
        parameters: BaseTypeSpecifier[],
        returnType: BaseTypeSpecifier,
        location?: SourceLocation
    ) {
        super(TypeSpecifierType.FUNCTION_TYPE, location);
        this.parameters = parameters;
        this.returnType = returnType;
    }

    public equals(other: any) {
        if (!other || !(other instanceof FunctionTypeSpecifier)) return false;
        const second = other as FunctionTypeSpecifier;
        return (
            this.returnType.equals(second.returnType) &&
            this.parameters.length === second.parameters.length &&
            this.parameters.every((p, i) => p.equals(second.parameters[i]))
        );
    }

    public toString() {
        return (
            `fn(${this.parameters.map((p) => p.toString()).join(', ')}) ` +
            `-> ${this.returnType.toString()}`
        );
    }

    public hasArity(arity: number) {
        return this.parameters.length === arity;
    }

    public static fromObject(obj: any) {
        return new FunctionTypeSpecifier(obj.parameters, obj.returnType, obj.location);
    }
}

export const VOID_TYPE: TypeSpecifier = new TypeSpecifier(PrimitiveType.VOID);

export const VOID_PTR_TYPE: TypeSpecifier = new TypeSpecifier(
    PrimitiveType.VOID,
    undefined,
    undefined,
    1
);

export const BOOLEAN_TYPE: TypeSpecifier = new TypeSpecifier(PrimitiveType.BOOLEAN);

export const INTEGER_TYPE: TypeSpecifier = new TypeSpecifier(PrimitiveType.INTEGER);

export const FLOAT_TYPE: TypeSpecifier = new TypeSpecifier(PrimitiveType.FLOAT);

export const STRING_TYPE: TypeSpecifier = new TypeSpecifier(PrimitiveType.STRING);

global.BaseTypeSpecifier = BaseTypeSpecifier;
global.TypeSpecifier = TypeSpecifier;
global.FunctionTypeSpecifier = FunctionTypeSpecifier;
