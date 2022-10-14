import { LabelGenerator } from '../../../lib/code-generator';

interface Constant {
    type: string;
    label: string;
    value: string;
}

export class ConstantGenerator extends LabelGenerator {
    private readonly _constants: Constant[] = [];

    constructor() {
        super('LC');
    }

    public generateNumber(value: string) {
        const label = this.generateLabel();
        this._constants.push({
            type: 'dq',
            label,
            value
        });
        return label;
    }

    public generateString(value: string) {
        const label = this.generateLabel();
        this._constants.push({
            type: 'db',
            label,
            value: `${value}, 0`
        });
        return label;
    }

    public get code() {
        return this._constants
            .map((c) => `${`${c.label}:`.padEnd(15)}${c.type.padEnd(10)}${c.value}`)
            .join('\n');
    }
}
