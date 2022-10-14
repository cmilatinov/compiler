import _ from 'lodash';

import { Tokenizer } from '../../tokenizer';
import { Grammar, GrammarRule } from '../grammar';
import { DerivationNode, GrammarParser } from '../grammar-parser';
import { EOF, EPSILON } from '../../symbols';
import * as LibUtils from '../../utils';
import { DEFAULT_PROCESSOR, StringProcessor } from '../../string-processor';

export class GrammarParserLL1 extends GrammarParser {
    private _parsingTableLL1: object;

    constructor(grammar: Grammar) {
        super(grammar);
        this._buildParseTableLL1();
        if (!this.isLL1()) {
            throw new Error(
                'Supplied grammar is not LL(1). Consider using another type of ' +
                    'parser for this grammar or modifying the grammar to make it LL(1).'
            );
        }
    }

    private _buildParseTableLL1() {
        if (this._parsingTableLL1) return this._parsingTableLL1;

        this._parsingTableLL1 = {};

        const nonTerminals = this._grammar.getNonTerminals();
        for (let i = 0; i < nonTerminals.length; i++) {
            this._parsingTableLL1[nonTerminals[i]] = {};
        }

        let addRuleToTable = (nonTerminal: string, terminal: string, rule: GrammarRule) => {
            if (!this._parsingTableLL1[nonTerminal][terminal])
                this._parsingTableLL1[nonTerminal][terminal] = rule;
            else if (Array.isArray(this._parsingTableLL1[nonTerminal][terminal]))
                this._parsingTableLL1[nonTerminal][terminal].push(rule);
            else
                this._parsingTableLL1[nonTerminal][terminal] = [
                    this._parsingTableLL1[nonTerminal][terminal],
                    rule
                ];
        };

        this._grammar.getRules().forEach((r) => {
            // Add each rule to every terminal in (FIRST(RHS) - {ε})
            const first = this._grammar.firstOf(r.RHS[0]).delete(EPSILON);
            first.forEach((t) => addRuleToTable(r.LHS, t, r));

            // If rhs is empty string, add the rule to every terminal in FOLLOW(LHS)
            if (_.isEqual(r.RHS, [EPSILON])) {
                const follow = this._grammar.followOf(r.LHS);
                follow.forEach((t) => addRuleToTable(r.LHS, t, r));
            }
        });

        return this._parsingTableLL1;
    }

    protected parse(tokenizer: Tokenizer): DerivationNode | null {
        const root = new DerivationNode(
            {
                type: this._grammar.getStartSymbol(),
                value: this._grammar.getStartSymbol(),
                location: tokenizer.getCursorLocation()
            },
            []
        );
        const stack: DerivationNode[] = [new DerivationNode({ type: EOF, value: EOF }, []), root];
        let lookahead = tokenizer.next();

        while (stack.length > 0) {
            const node = stack.pop();
            if (lookahead.type === node.token.type) {
                node.token = lookahead;

                let flag = false;
                while (!flag) {
                    try {
                        lookahead = tokenizer.next();
                        flag = true;
                    } catch (err) {
                        this.error(err.message);
                    }
                }
            } else {
                const rule = this._parsingTableLL1[node.token.type]
                    ? this._parsingTableLL1[node.token.type][lookahead.type]
                    : undefined;
                if (!rule) {
                    if (this._grammar.firstOf(node.token.type).has(EPSILON)) continue;
                    this.error(
                        `${lookahead.location.toString()} Unexpected token '${Grammar.stringify(
                            lookahead.type
                        )}', expected '${Grammar.stringify(node.token.type)}'.\n`
                    );
                    return null;
                } else if (Array.isArray(rule)) {
                    this.error(
                        `${lookahead.location.toString()} Unexpected token '${Grammar.stringify(
                            lookahead.type
                        )}', expected '${Grammar.stringify(node.token.type)}'.`
                    );
                    this.error(`Multiple reduction rules found:`);
                    rule.forEach((r) => this.error(`     ${r.toString()}`));
                    return null;
                }

                const production = rule.RHS.filter((s) => s !== EPSILON)
                    .reverse()
                    .map(
                        (s) =>
                            new DerivationNode(
                                { type: s, value: s, location: lookahead.location },
                                []
                            )
                    );
                stack.push(...production);
                node.token.location = lookahead.location;
                node.children = production.reverse();
                node.rule = rule;
            }
        }

        return root;
    }

    public isLL1() {
        for (let k1 in this._parsingTableLL1) {
            for (let k2 in this._parsingTableLL1[k1]) {
                if (Array.isArray(this._parsingTableLL1[k1][k2])) return false;
            }
        }
        return true;
    }

    public printParseTable(print: StringProcessor = DEFAULT_PROCESSOR) {
        const tableObject = {};
        Object.keys(this._parsingTableLL1).forEach((k) => {
            tableObject[k] = {};
            Object.keys(this._parsingTableLL1[k]).forEach(
                (j) => (tableObject[k][j] = this._parsingTableLL1[k][j]?.toString())
            );
        });
        const table = LibUtils.stringTable(tableObject);
        print(table);
    }
}
