import { LRItem, LRItemBuilder } from '../items';
import { Grammar } from '../../grammar';
import { OrderedSet } from 'immutable';

export type GraphTransitions<T extends LRItem> = { [key: string]: GraphState<T> };

export class GraphState<T extends LRItem> {
    private _isClosured: boolean;
    private readonly _itemBuilder: LRItemBuilder<T>;
    private readonly _grammar: Grammar;

    public items: OrderedSet<T>;
    public readonly transitions: GraphTransitions<T>;

    constructor(
        itemBuilder: LRItemBuilder<T>,
        grammar: Grammar,
        items: OrderedSet<T>,
        transitions: GraphTransitions<T> = {}
    ) {
        this._itemBuilder = itemBuilder;
        this._grammar = grammar;
        this.items = items;
        this.transitions = transitions;
    }

    public closure() {
        if (this._isClosured) return;

        this.items = this._itemBuilder.closure(this._grammar, this.items);
        this._isClosured = true;
    }

    public goto(symbol: string) {
        return this._itemBuilder.goto(this, symbol);
    }

    public isClosured(): boolean {
        return this._isClosured;
    }

    public isFinal(): boolean {
        return this.items.some((i) => i.isFinal());
    }

    public toString(): string {
        return this.items.map((i) => i.toString()).join('\n');
    }

    public equals(other: GraphState<T>) {
        return this.items.equals(other.items);
    }
}
