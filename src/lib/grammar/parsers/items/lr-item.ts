import { OrderedSet } from 'immutable';

import { Grammar, GrammarRule } from '../../grammar';
import { GraphState } from '../collection';

export interface LRItem {
    readonly rule: GrammarRule;
    isFinal(): boolean;
}

export interface LRItemBuilder<T extends LRItem> {
    new (...args: any[]): T;
    closure(grammar: Grammar, itemSet: OrderedSet<T>): OrderedSet<T>;
    goto(state: GraphState<T>, symbol: string): OrderedSet<T>;
}
