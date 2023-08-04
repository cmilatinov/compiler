import { LR0Item, LRItemBuilder } from './items';
import { Grammar } from '../grammar';
import { CanonicalCollection, GraphState } from './collection';
import { Set, OrderedSet } from 'immutable';
import { LRParseTable, ParseTableAction, ParseTableActionType } from './lr-parse-table';
import { EOF, EPSILON } from '../../symbols';
import { TokenInstance, Tokenizer } from '../../tokenizer';
import { DerivationNode, GrammarParser } from '../grammar-parser';

export abstract class GrammarParserLR<ItemType extends LR0Item> extends GrammarParser {
    protected _collection: CanonicalCollection<ItemType>;
    protected _parseTable: LRParseTable;
    protected _itemBuilder: LRItemBuilder<ItemType>;

    constructor(grammar: Grammar, parseTable?: LRParseTable) {
        super(grammar);
        if (parseTable) {
            this._parseTable = parseTable;
        } else {
            this._init();
        }
    }

    protected abstract _init();

    protected _stateIndex(state: GraphState<ItemType>) {
        return this._collection.states.findIndex((s) => s.equals(state));
    }

    protected _isAcceptState<T extends LR0Item>(state: GraphState<T>) {
        if (!state.isFinal()) return false;
        if (state.items.size !== 1) return false;
        const item = state.items.first();
        return (
            item.dotIndex > 0 &&
            item.rule.LHS === this._grammar.getAugmentedStartSymbol() &&
            item.rule.RHS[item.dotIndex - 1] === this._grammar.getStartSymbol()
        );
    }

    protected _buildCanonicalCollection<T extends ItemType>(
        ctor: LRItemBuilder<T>
    ): CanonicalCollection<T> {
        this._itemBuilder = ctor;
        const augmentedRule = this._augmentedGrammar.getRules()[0];
        type StackItem = [OrderedSet<T>, GraphState<T>, string];
        const itemStack: StackItem[] = [[OrderedSet([new ctor(augmentedRule, 0)]), undefined, '']];

        const states: GraphState<T>[] = [];
        while (itemStack.length > 0) {
            const [itemSet, prevState, transitionSymbol] = itemStack.shift();
            const state = new GraphState(ctor, this._grammar, OrderedSet<T>(itemSet));
            state.closure();

            const existingState = states.find((s) => s.equals(state));
            if (!existingState) {
                // Add new state
                states.push(state);

                // Add the next items to the queue
                itemStack.push(
                    ...OrderedSet<string>(
                        state.items
                            .toJSON()
                            .filter((i) => !i.isFinal())
                            .map((i) => i.rule.RHS[i.dotIndex])
                    )
                        .toJSON()
                        .map<StackItem>((s) => {
                            return [state.goto(s), state, s];
                        })
                );
            }

            // Add transition
            if (prevState) {
                prevState.transitions[transitionSymbol] = existingState || state;
            }
        }

        return new CanonicalCollection<T>(states);
    }

    protected _buildParseTable<T extends LR0Item>(
        collection: CanonicalCollection<T>,
        reduceTerminalSetFn: (item: T, state: GraphState<T>, stateIndex: number) => Set<string>
    ): LRParseTable {
        const table = new LRParseTable();
        const rules = this._augmentedGrammar.getRules();
        collection.states.forEach((s, i) => {
            if (s.isFinal()) {
                // Accept
                if (this._isAcceptState(s)) {
                    table.addEntry(i, EOF, new ParseTableAction(ParseTableActionType.ACCEPT));
                    return;
                }

                // Reduce
                const items = s.items.filter((i) => i.isFinal()).toJSON();
                const ruleIndexes = items.map((i) => rules.findIndex((r) => r.equals(i.rule)));
                items.forEach((item, itemIndex) => {
                    const ruleIndex = ruleIndexes[itemIndex];
                    reduceTerminalSetFn(item, s, i).forEach((t) =>
                        table.addEntry(
                            i,
                            t,
                            new ParseTableAction(ParseTableActionType.REDUCE, ruleIndex)
                        )
                    );
                });
            }

            // Shift / Goto
            Object.keys(s.transitions).forEach((t) => {
                const targetStateIndex = collection.states.findIndex((state) =>
                    state.equals(s.transitions[t])
                );
                table.addEntry(
                    i,
                    t,
                    new ParseTableAction(
                        Grammar.isTerminal(t)
                            ? ParseTableActionType.SHIFT
                            : ParseTableActionType.GOTO,
                        targetStateIndex
                    )
                );
            });
        });
        return table;
    }

    public parse(tokenizer: Tokenizer): DerivationNode | null {
        const stack: (number | DerivationNode)[] = [0];

        const rules = this._augmentedGrammar.getRules();
        let lookahead: TokenInstance = tokenizer.next();

        const fetchNextToken = () => {
            while (true) {
                try {
                    lookahead = tokenizer.next();
                    break;
                } catch (err) {
                    this.error(err.message);
                }
            }
        };

        while (stack.length > 0) {
            const element = stack[0];

            // Get action from table
            const action: ParseTableAction =
                typeof element === 'number'
                    ? this._parseTable.getAction(element, lookahead.type)
                    : this._parseTable.getAction(
                          stack.find((e) => typeof e === 'number') as number,
                          element.rule.LHS
                      );

            // console.log();
            // console.log(lookahead.type);
            // console.log(stack.map((e) => (typeof e === 'number' ? e : e.token.type)));
            // console.log(action.toString());
            switch (action.type) {
                case ParseTableActionType.ACCEPT:
                    return stack[1] as DerivationNode;

                case ParseTableActionType.GOTO:
                    stack.unshift(action.value);
                    break;

                case ParseTableActionType.SHIFT:
                    stack.unshift(new DerivationNode(lookahead, []));
                    stack.unshift(action.value);
                    fetchNextToken();
                    break;

                case ParseTableActionType.REDUCE:
                    const rule = rules[action.value];
                    const childrenNodes = stack
                        .splice(0, 2 * rule.RHS.filter((i) => i !== EPSILON).length)
                        .filter((_, i) => i % 2 === 1)
                        .reverse() as DerivationNode[];
                    stack.unshift(
                        new DerivationNode(
                            {
                                type: rule.LHS,
                                value: rule.LHS,
                                location: childrenNodes[0]?.token.location || lookahead.location
                            },
                            childrenNodes,
                            rule
                        )
                    );
                    break;

                case ParseTableActionType.REJECT:
                    this.error(`Unexpected token '${lookahead.value}'.`, lookahead.location);
                    return null;
            }
        }
        return null;
    }

    public get parseTable(): LRParseTable {
        return this._parseTable;
    }

    public get canonicalCollection(): CanonicalCollection<any> {
        return this._collection;
    }
}
