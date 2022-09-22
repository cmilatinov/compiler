import { OrderedSet, Set } from 'immutable';
import _ from 'lodash';

import { LR0Item } from './lr0-item';
import { GraphState } from '../collection/canonical-collection';
import { Grammar, GrammarRule } from '../../grammar';
import { EOF, EPSILON } from '../../../symbols';

export class LR1Item extends LR0Item {
    public lookaheads: Set<string>;

    constructor(rule: GrammarRule, dotIndex: number, lookaheads: Set<string> = Set<string>([EOF])) {
        super(rule, dotIndex);
        this.lookaheads = lookaheads;
    }

    public toString(): string {
        return super.toString() + `, ${this.lookaheads.map((t) => Grammar.stringify(t)).join('/')}`;
    }

    public equals(other: LR1Item): boolean {
        return super.equals(other) && this.lookaheads.equals(other.lookaheads);
    }

    public ruleEquals(other: LR1Item): boolean {
        return super.equals(other);
    }

    public static closure(grammar: Grammar, itemSet: OrderedSet<LR1Item>): OrderedSet<LR1Item> {
        // closure(S)
        // For each item [A → α ⋅ B β, t] in S,
        //   For each production B → γ in G,
        //     For each token b in FIRST(βt),
        //       Add [B → ⋅ γ, b] to S

        // Iterative algorithm
        // Compute closure(S) iteratively until
        // no more new items are added to the closure set
        const rules = grammar.getRules();
        let nextClosureSet;
        do {
            nextClosureSet = OrderedSet<LR1Item>(itemSet);
            itemSet.forEach((item) => {
                // Final item, no other items to add to closure
                if (item.isFinal()) return;

                const filteredRules = rules.filter((r) => r.LHS === item.rule.RHS[item.dotIndex]);
                filteredRules.forEach((r) => {
                    // Construct the first set of the remaining part of the rule
                    // and the lookahead set
                    const ruleEnd = _.slice(item.rule.RHS, item.dotIndex + 1);
                    let firstSet = grammar.firstOfSequence(ruleEnd);
                    firstSet = firstSet.delete(EPSILON);
                    if (firstSet.contains(EOF)) {
                        firstSet = firstSet.delete(EOF);
                        firstSet = firstSet.union(item.lookaheads);
                    }

                    // Add the item to the closure set
                    // Additionally, if another item with the same rule is already present,
                    // simply add this item's lookahead to the existing item's
                    const itemToAdd = new LR1Item(r, 0, firstSet);
                    const existingItem: LR1Item = nextClosureSet.find((i) =>
                        i.ruleEquals(itemToAdd)
                    );
                    if (!existingItem) {
                        nextClosureSet = nextClosureSet.add(new LR1Item(r, 0, firstSet));
                    } else {
                        existingItem.lookaheads = existingItem.lookaheads.union(firstSet);
                    }
                });
            });
        } while (nextClosureSet.size !== itemSet.size && (itemSet = nextClosureSet));

        return itemSet;
    }

    public static goto(state: GraphState<LR1Item>, symbol: string): OrderedSet<LR1Item> {
        return OrderedSet<LR1Item>(
            state.items
                .toJSON()
                .filter((i) => i.dotIndex < i.rule.RHS.length && i.rule.RHS[i.dotIndex] === symbol)
                .map((i) => new LR1Item(i.rule, i.dotIndex + 1, Set<string>(i.lookaheads)))
        );
    }
}
