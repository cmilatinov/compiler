export class Pair<L, R> {
    constructor(public readonly first: L, public readonly second: R) {}

    public toString() {
        return `(${this.first?.toString()}, ${this.second?.toString()})`;
    }

    public equals(other: any) {
        if (!other) return false;
        if (!(other instanceof Pair)) return false;
        if (
            (typeof (this.first as any).equals === 'function' &&
                !(this.first as any)?.equals(other.first)) ||
            this.first !== other.first
        )
            return false;
        return !(
            (typeof (this.second as any).equals === 'function' &&
                !(this.second as any)?.equals(other.second)) ||
            this.second !== other.second
        );
    }

    public hashCode() {
        return this.toString();
    }
}
