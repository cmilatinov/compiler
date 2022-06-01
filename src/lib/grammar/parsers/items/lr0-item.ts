import _ from 'lodash';

import { Grammar, GrammarRule } from '../../grammar';
import { LRItem } from './lr-item';
import { EPSILON } from '../../../symbols';
import { OrderedSet } from 'immutable';
import { GraphState } from '../collection/canonical-collection';

export class LR0Item implements LRItem {

    public readonly rule: GrammarRule;
    public readonly dotIndex: number;

    constructor(rule: GrammarRule, dotIndex: number) {
        this.rule = rule;
        this.dotIndex = dotIndex;
    }

    public isFinal(): boolean {
        return _.isEqual(this.rule.RHS, [EPSILON]) || this.dotIndex === this.rule.RHS.length;
    }

    public toString(): string {
        const rhs = [...this.rule.RHS];
        rhs.splice(this.dotIndex, 0, '•');
        return `${this.rule.LHS} -> ${rhs.join(' ')}`;
    }

    public equals(other: LR0Item): boolean {
        return this.rule.equals(other.rule) && this.dotIndex === other.dotIndex;
    }

    public hashCode(): string {
        return this.toString();
    }

    public static closure(grammar: Grammar, itemSet: OrderedSet<LR0Item>): OrderedSet<LR0Item> {
        // closure(S)
        // For each item [A → α ⋅ B β] in S,
        //   For each production B → γ in G,
        //     Add [B → ⋅ γ] to S

        // Iterative algorithm
        // Compute closure(S) iteratively until
        // no more new items are added to the closure set
        const rules = grammar.getRules();
        let nextClosureSet;
        do {
            nextClosureSet = OrderedSet<LR0Item>(itemSet);
            itemSet.forEach(item => {
                // Final item, no other items to add to closure
                if (item.isFinal())
                    return;

                // Add every rule with LHS equal to the non-terminal after the dot
                const filteredRules = rules.filter(r => r.LHS === item.rule.RHS[item.dotIndex]);
                filteredRules.forEach(r => {
                    const itemToAdd = new LR0Item(r, 0);
                    nextClosureSet = nextClosureSet.add(itemToAdd);
                });
            });
        } while(nextClosureSet.size !== itemSet.size && (itemSet = nextClosureSet));

        return itemSet;
    }

    public static goto(state: GraphState<LR0Item>, symbol: string): OrderedSet<LR0Item> {
        return OrderedSet<LR0Item>(state.items
            .toJSON()
            .filter(i => i.dotIndex < i.rule.RHS.length && i.rule.RHS[i.dotIndex] === symbol)
            .map(i => new LR0Item(i.rule, i.dotIndex + 1)));
    }
}
