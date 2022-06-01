import { Set } from 'immutable';

import { Grammar } from '../../grammar';
import { LRItem, LRItemBuilder } from '../items/lr-item';

export type GraphTransitions<T extends LRItem> = { [key: string]: GraphState<T> };

export class GraphState<T extends LRItem> {
    private _isClosured: boolean;
    private readonly _itemBuilder: LRItemBuilder<T>;
    private readonly _grammar: Grammar;

    public items: Set<T>;
    public readonly transitions: GraphTransitions<T>;

    constructor(itemBuilder: LRItemBuilder<T>, grammar: Grammar, items: Set<T>, transitions: GraphTransitions<T> = {}) {
        this._itemBuilder = itemBuilder;
        this._grammar = grammar;
        this.items = items;
        this.transitions = transitions;
    }

    public closure() {
        if (this._isClosured)
            return;

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
        return this.items.some(i => i.isFinal());
    }

    public toString(): string {
        return this.items.map(i => i.toString()).join('\n');
    }

    public equals(other: GraphState<T>) {
        return this.items.equals(other.items);
    }
}

export class CanonicalCollection<T extends LRItem> {
    public readonly states: GraphState<T>[];

    constructor(states: GraphState<T>[]) {
        this.states = states;
    }

    public contains(state: GraphState<T>): boolean {
        return !!this.states.find(s => s.equals(state));
    }

    public toString(): string {
        let str = 'digraph {\n    rankdir=LR;\n';
        str += '\n';
        this.states.forEach((s, i) => str += `    n${i} [label="${s.toString().replaceAll('\n', '\\n')}", shape=circle];\n`);
        str += '\n';this.states.forEach((s, i) =>
            Object.keys(s.transitions)
                .forEach(t => str += `    n${i} -> n${this.states.indexOf(s.transitions[t])} [label="${Grammar.stringify(t)}"];\n`));
        str += '}';
        return str;
    }
}
