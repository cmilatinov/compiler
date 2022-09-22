import { SourceLocation } from '../../lib/tokenizer';
import * as TypeUtils from './type-utils';

export abstract class BaseTypeSpecifier {
    public readonly type: string;
    public readonly location?: SourceLocation;

    protected constructor(type: string, location?: SourceLocation) {
        this.type = type;
        this.location = location;
    }

    public abstract equals(other: any): boolean;

    public abstract toString(): string;
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
        super('TypeSpecifier', location);
        this.value = value;
        this.arraySizes = arraySizes;
        this.pointerLevel = pointerLevel;
        this.referenceLevel = referenceLevel;
    }

    public equals(other: any) {
        if (!other || !(other instanceof TypeSpecifier)) return false;
        return TypeUtils.typeEquals(this, other);
    }

    public toString() {
        return TypeUtils.stringifyType(this);
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
        super('FunctionTypeSpecifier', location);
        this.parameters = parameters;
        this.returnType = returnType;
    }

    public equals(other: any) {
        if (!other || !(other instanceof FunctionTypeSpecifier)) return false;
        return TypeUtils.functionTypeEquals(this, other);
    }

    public toString() {
        return TypeUtils.stringifyFunctionType(this);
    }

    public hasArity(arity: number) {
        return this.parameters.length === arity;
    }

    public static fromObject(obj: any) {
        return new FunctionTypeSpecifier(obj.parameters, obj.returnType, obj.location);
    }
}

global.BaseTypeSpecifier = BaseTypeSpecifier;
global.TypeSpecifier = TypeSpecifier;
global.FunctionTypeSpecifier = FunctionTypeSpecifier;
