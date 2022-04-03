export class LabelGenerator {

    private _nextLabel: number;

    constructor() {
        this._nextLabel = 0;
    }

    generateLabel(): string {
        return `L${String(this._nextLabel++).padStart(3, '0')}`;
    }

}
