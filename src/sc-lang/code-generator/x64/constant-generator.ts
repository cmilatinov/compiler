import { LabelGenerator } from '../../../lib/code-generator';
import { BaseTypeSpecifier, STRING_TYPE } from '../../type/type-specifier';

interface Constant {
    type: ConstantType;
    label: string;
    value: string;
    normalizedValue: string;
}

interface ConstantMap {
    [key: string]: Constant;
}

enum ConstantType {
    BYTE = 'db',
    WORD = 'dw',
    DOUBLE_WORD = 'dd',
    QUAD_WORD = 'dq'
}

export class ConstantGenerator extends LabelGenerator {
    private readonly _constants: Constant[] = [];

    constructor() {
        super('LC');
    }

    private _normalizeInteger(value: string) {
        return Number(value).toString();
    }

    private _normalizeFloat(value: string) {
        return Number(value).toFixed(5);
    }

    private _normalize(type: BaseTypeSpecifier, value: string) {
        if (type.equals(STRING_TYPE)) return `\`${value}\`, 0`;
        if (type.isFloatingType()) return this._normalizeFloat(value);
        return this._normalizeInteger(value);
    }

    private _constantType(type: BaseTypeSpecifier, size: number) {
        if (type.equals(STRING_TYPE)) return ConstantType.BYTE;
        switch (size) {
            case 1:
                return ConstantType.BYTE;
            case 2:
                return ConstantType.WORD;
            case 4:
                return ConstantType.DOUBLE_WORD;
            case 8:
                return ConstantType.QUAD_WORD;
        }
    }

    public generate(type: BaseTypeSpecifier, size: number, value: string) {
        const constantType = this._constantType(type, size);
        const normalizedValue = this._normalize(type, value);
        const existingConstant = this._constants.find(
            (c) => c.normalizedValue === normalizedValue && c.type === constantType
        );
        if (existingConstant) {
            return existingConstant;
        }

        const constant = {
            type: constantType,
            label: this.generateLabel(),
            value,
            normalizedValue
        };
        this._constants.push(constant);
        return constant;
    }

    public get code() {
        return Object.values(this._constants)
            .map((c) => `${`${c.label}:`.padEnd(15)}${c.type.padEnd(10)}${c.normalizedValue}`)
            .join('\n');
    }
}
