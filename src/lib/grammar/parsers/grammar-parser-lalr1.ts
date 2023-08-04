import { LR0Item, LR1Item } from './items';
import { GrammarParserLR } from './grammar-parser-lr';
import { LRParseTable } from './lr-parse-table';
import { Map, Seq, Set } from 'immutable';
import { Grammar } from '../grammar';
import { EOF, EPSILON } from '../../symbols';
import { GraphState } from './collection';
import { Pair } from '../../utils/pair';
import { GrammarParser } from '../grammar-parser';

export class GrammarParserLALR1 extends GrammarParserLR<LR0Item> {
    protected _init() {
        this._collection = this._buildCanonicalCollection(LR0Item);

        const lookaheadSets = Map<Pair<number, LR0Item>, Set<string>>().asMutable();
        this._collection.states
            .filter((s) => s.isFinal())
            .map<[number, GraphState<LR0Item>]>((s) => [this._stateIndex(s), s])
            .forEach(([si, s]) =>
                s.items
                    .filter((i) => i.isFinal())
                    .forEach((i) => {
                        const lookaheads = this._lalr1(i, s);
                        lookaheadSets.set(new Pair(si, i), lookaheads);
                    })
            );

        // console.log();
        // console.log(
        //     lookaheadSets
        //         .toArray()
        //         .map(([k, v]) => `[${k.toString()}], { ${v.join(', ')} }`)
        //         .join('\n')
        // );
        // console.log();

        this._parseTable = this._buildParseTable(this._collection, (i, _, si) => {
            return lookaheadSets.get(new Pair(si, i)) || Set<string>();
        });
    }

    private _goto(state: GraphState<LR0Item>, symbol: string) {
        const goto = new GraphState<LR0Item>(
            this._itemBuilder,
            this._grammar,
            this._itemBuilder.goto(state, symbol)
        );
        goto.closure();
        return goto;
    }

    private _pred(state: GraphState<LR0Item>, sequence: string[]) {
        // Empty sequence
        if (sequence.length === 0 || (sequence.length === 1 && sequence[0] === EPSILON)) {
            return Set([state]);
        }

        const last = sequence[sequence.length - 1];
        const pred = Set<GraphState<LR0Item>>().asMutable();
        this._collection.states.forEach((s) => {
            const goto = this._goto(s, last);
            if (goto.equals(state)) {
                pred.union(this._pred(s, sequence.slice(0, -1)));
            }
        });
        return pred;
    }

    // https://dl.acm.org/doi/pdf/10.1145/357121.357126
    private _lalr1(item: LR0Item, state: GraphState<LR0Item>) {
        const la = Set<string>().asMutable();
        const tm = Set<GraphState<LR0Item>>().asMutable();
        const visited = Set<Pair<string, GraphState<LR0Item>>>().asMutable();

        const trans = (state: GraphState<LR0Item>) => {
            // console.log(`trans(${this._stateIndex(state)})`);
            tm.add(state);
            if (this._isAcceptState(state)) {
                la.add(EOF);
                return;
            }
            state.items
                .filter((i) => i.dotIndex < i.rule.RHS.length)
                .forEach((i) => {
                    const x = i.rule.RHS[i.dotIndex];
                    if (x !== EPSILON && Grammar.isTerminal(x)) {
                        la.add(x);
                    } else if (this._grammar.isNullable(x)) {
                        const goto = this._goto(state, x);
                        if (!tm.contains(goto)) {
                            trans(goto);
                        }
                    }
                });
        };

        const lalr = (item: LR0Item, state: GraphState<LR0Item>) => {
            const a = item.rule.LHS;
            const alpha = item.rule.RHS.slice(0, item.dotIndex);
            // console.log(
            //     `lalr([${item.toString()}], ` +
            //         `${this._collection.states.findIndex((s) => s.equals(state))})`
            // );

            const filtered = this._pred(state, alpha).filter(
                (s) => !visited.contains(new Pair(a, s))
            );
            filtered.forEach((s) => {
                visited.add(new Pair(a, s));
                trans(this._goto(s, a));
                s.items
                    .filter(
                        (i) =>
                            i.rule.RHS[i.dotIndex] === item.rule.LHS &&
                            this._grammar.isNullableSequence(i.rule.RHS.slice(i.dotIndex + 1))
                    )
                    .forEach((i) => lalr(i, s));
            });
        };

        if (this._grammar.getAugmentedStartSymbol() === item.rule.LHS) return la.asImmutable();

        lalr(item, state);
        return la.asImmutable();
    }
}
