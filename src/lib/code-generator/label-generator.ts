export class LabelGenerator {
    constructor(
        private readonly _prefix: string = 'L',
        private readonly _padLength: number = 3,
        private _nextLabel: number = 1
    ) {}

    generateLabel(): string {
        return `${this._prefix}${String(this._nextLabel++).padStart(this._padLength, '0')}`;
    }
}
