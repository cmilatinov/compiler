import { LR0Item } from './items/lr0-item';
import { LRItemBuilder } from './items/lr-item';
import { Grammar } from '../grammar';
import { CanonicalCollection, GraphState } from './collection/canonical-collection';
import { OrderedSet } from 'immutable';
import { ParseTable, ParseTableAction, ParseTableActionType } from './lr-parse-table';
import { EOF, EPSILON } from '../../symbols';
import { TokenInstance, Tokenizer } from '../../tokenizer';
import { StringProcessor } from '../../string-processor';
import { DerivationNode } from '../grammar-parser';

export class GrammarParserLR {

    public static buildCanonicalCollection<T extends LR0Item>(
        ctor: LRItemBuilder<T>,
        grammar: Grammar
    ): CanonicalCollection<T> {
        const augmentedGrammar = grammar.getAugmentedGrammar();
        const augmentedRule = augmentedGrammar.getRules()[0];
        type StackItem = [OrderedSet<T>, GraphState<T>, string];
        const itemStack: StackItem[] = [[OrderedSet([new ctor(augmentedRule, 0)]), undefined, '']];

        const states: GraphState<T>[] = [];
        while (itemStack.length > 0) {
            const [itemSet, prevState, transitionSymbol] = itemStack.shift();
            const state = new GraphState(ctor, grammar, itemSet);
            state.closure();

            const existingState = states.find(s => s.equals(state));
            if (!existingState) {
                // Add new state
                states.push(state);

                // Add the next items to the queue
                itemStack.push(
                    ...state.items.toJSON()
                        .filter(i => !i.isFinal())
                        .map<StackItem>(i => [state.goto(i.rule.RHS[i.dotIndex]), state, i.rule.RHS[i.dotIndex]])
                );
            }

            // Add transition
            if (prevState) {
                prevState.transitions[transitionSymbol] = existingState || state;
            }
        }

        return new CanonicalCollection<T>(states);
    }

    public static buildParseTable<T extends LR0Item>(
        grammar: Grammar,
        collection: CanonicalCollection<T>,
        reduceTerminalSetFn: (grammar: Grammar, item: T) => string[]
    ): ParseTable {
        const table = new ParseTable();
        const rules = grammar.getAugmentedGrammar().getRules();
        collection.states.forEach((s, i) => {
            if (s.isFinal()) {
                // Accept
                if (s.items.size === 1) {
                    const item = s.items.toJSON()[0];
                    if (item.dotIndex > 0 && item.rule.RHS[item.dotIndex - 1] === grammar.getStartSymbol()) {
                        table.addEntry(i, EOF, new ParseTableAction(ParseTableActionType.ACCEPT));
                        return;
                    }
                }

                // Reduce
                const items = s.items.filter(i => i.isFinal()).toJSON();
                const ruleIndexes = items.map(i => rules.findIndex(r => r.equals(i.rule)));
                items.forEach((item, itemIndex) => {
                    const ruleIndex = ruleIndexes[itemIndex];
                    reduceTerminalSetFn(grammar, item)
                        .forEach(t => table.addEntry(i, t, new ParseTableAction(ParseTableActionType.REDUCE, ruleIndex)));
                });
            }

            // Shift / Goto
            Object.keys(s.transitions).forEach(t => {
                const targetStateIndex = collection.states.findIndex(state => state.equals(s.transitions[t]));
                table.addEntry(i, t, new ParseTableAction(
                    Grammar.isTerminal(t) ?
                        ParseTableActionType.SHIFT :
                        ParseTableActionType.GOTO, targetStateIndex)
                );
            });
        });
        return table;
    }

    public static parse(
        grammar: Grammar,
        parseTable: ParseTable,
        tokenizer: Tokenizer,
        printErr: StringProcessor
    ): DerivationNode {
        const stack: (number | DerivationNode)[] = [0];

        const rules = grammar.getAugmentedGrammar().getRules();
        let lookahead: TokenInstance = tokenizer.next();

        const fetchNextToken = () => {
            while (true) {
                try {
                    lookahead = tokenizer.next();
                    break;
                } catch (err) {
                    printErr(`${err.message}\n`);
                }
            }
        }

        while (stack.length > 0) {
            const element = stack[0];

            // Get action from table
            const action: ParseTableAction =
                typeof element === 'number' ?
                    parseTable.getAction(element, lookahead.type) :
                    parseTable.getAction(stack.find(e => typeof e === 'number') as number, element.rule.LHS);

            // console.log(lookahead.type);
            // console.log(stack.map(e => typeof e === 'number' ? e : e.token.type));
            // console.log(action.toString());
            switch (action.type) {
                case ParseTableActionType.ACCEPT:
                    return stack[1] as DerivationNode;

                case ParseTableActionType.GOTO:
                    stack.unshift(action.value);
                    break;

                case ParseTableActionType.SHIFT:
                    stack.unshift(new DerivationNode(lookahead, []))
                    stack.unshift(action.value);
                    fetchNextToken();
                    break;

                case ParseTableActionType.REDUCE:
                    const rule = rules[action.value];
                    const childrenNodes = stack.splice(0, 2 * rule.RHS.filter(i => i !== EPSILON).length)
                        .filter((_, i) => i % 2 === 1)
                        .reverse() as DerivationNode[];
                    stack.unshift(new DerivationNode({
                        type: rule.LHS,
                        value: rule.LHS,
                        location: childrenNodes[0]?.token.location || lookahead.location
                    }, childrenNodes, rule));
                    break;

                case ParseTableActionType.REJECT:
                    printErr(`Unexpected token "${lookahead.value}".\n`);
                    return null;
            }
        }
        return null;
    }

}