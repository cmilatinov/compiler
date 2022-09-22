import * as fs from 'fs';
import { Set } from 'immutable';
import _ from 'lodash';

import { EOF, EPSILON } from '../symbols';
import {
    MultiLineCommentToken,
    SingleLineCommentToken,
    TokenType,
    WhitespaceToken
} from '../tokenizer';
import { DEFAULT_PROCESSOR, StringProcessor } from '../string-processor';
import GRMLang from '../../../grammars/grm-lang.json';
import { GrammarParserFactory } from './grammar-parser-factory';
import { GrammarParserType } from './grammar-parser';

export class GrammarRule {
    public readonly LHS: string;
    public readonly RHS: string[];
    public readonly reduction?: Function;

    public constructor(lhs, rhs, reduction?) {
        this.LHS = lhs;
        this.RHS = rhs;
        this.reduction = reduction;
    }

    public toString(): string {
        return `${this.LHS} -> ${this.RHS.map((s) => Grammar.stringify(s)).join(' ')}`;
    }

    public toJSMachineString(): string {
        return `${this.LHS} -> ${this.RHS.map((s) =>
            s === EPSILON ? `''` : s === `'->'` ? '-=>' : Grammar.stringify(s)
        ).join(' ')}`;
    }

    public equals(other: GrammarRule): boolean {
        return this.LHS === other.LHS && _.isEqual(this.RHS, other.RHS);
    }
}

export class GrammarFactory {
    public static grm() {
        return this.fromJSON(GRMLang);
    }

    public static fromJSONFile(file: string) {
        const jsonStr: string = fs.readFileSync(file).toString();
        return this.fromJSONString(jsonStr);
    }

    public static fromJSONString(json: string) {
        // Parse json
        try {
            return this.fromJSON(JSON.parse(json));
        } catch (err) {
            throw new SyntaxError('Invalid JSON string.');
        }
    }

    public static fromJSON(rules: any[]) {
        // Check validity
        if (
            !Array.isArray(rules) ||
            rules.some((r) => ['LHS', 'RHS'].some((p) => !r.hasOwnProperty(p))) ||
            rules.some((r) => !Array.isArray(r.RHS))
        ) {
            throw new SyntaxError('Invalid JSON grammar.');
        }

        // Convert to grammar rules
        const grammarRules = rules.map(
            (r) =>
                new GrammarRule(
                    r.LHS,
                    r.RHS,
                    r.reduction
                        ? new Function(
                              `let $$;\n${r.reduction.replace(
                                  /\$([0-9]+)/g,
                                  'arguments[$1]'
                              )}\nreturn $$;`
                          )
                        : undefined
                )
        );

        return new Grammar(grammarRules);
    }

    public static fromFile(file: string): Grammar {
        const grammarStr: string = fs.readFileSync(file).toString().replace(/\r\n/g, '\n');
        return this.fromString(grammarStr);
    }

    public static fromString(grammarStr: string): Grammar {
        const grammar = this.grm();
        const grammarParser = GrammarParserFactory.create(GrammarParserType.SLR1, grammar);
        const derivation = grammarParser.parseString(grammarStr);
        if (!derivation) return null;
        const ast = grammarParser.createAST(derivation);
        if (!ast) return null;
        const grammarRules = (ast as unknown as any[]).reduce(
            (acc, p) => [
                ...acc,
                ...p.RHS.map((rhs) => {
                    const RHS =
                        typeof rhs === 'string' ? [rhs] : rhs.length === 0 ? [EPSILON] : rhs;
                    const reduction = p.reduction
                        ?.substring(2, p.reduction.length - 2)
                        .trim()
                        .replace(/\$([0-9]+)/g, 'arguments[$1]');
                    const reductionFn = reduction
                        ? new Function(`let $$;\n${reduction}\nreturn $$;`)
                        : undefined;
                    return new GrammarRule(p.LHS, RHS, reductionFn);
                })
            ],
            []
        );
        return new Grammar(grammarRules);
    }
}

export class Grammar {
    private readonly _rules: GrammarRule[];
    private readonly _terminalRules: GrammarRule[];
    private readonly _startSymbol: string;

    private _nonTerminals: string[];
    private _terminals: string[];
    private _firstSets: { [key: string]: Set<string> };
    private _followSets: { [key: string]: Set<string> };
    private _tokenTypes: TokenType[];

    public constructor(rules: GrammarRule[]) {
        this._rules = rules.filter((r) => !Grammar.isTerminal(r.LHS));
        this._terminalRules = rules.filter((r) => Grammar.isTerminal(r.LHS));
        this._startSymbol = rules[0].LHS;
        this._firstSets = {};
        this._followSets = {};
        this.getSymbols();
        this.createTokenTypes();
        this.computeFirstFollow();
    }

    private createTokenTypes() {
        const terminals = this._terminals.filter((t) => t !== EPSILON && t !== EOF);
        this._tokenTypes = [WhitespaceToken, SingleLineCommentToken, MultiLineCommentToken].concat(
            terminals
                .sort((a, b) => {
                    const terminalRuleA = this._terminalRules.find((r) => r.LHS === a);
                    const terminalRuleB = this._terminalRules.find((r) => r.LHS === b);
                    return Number(!!terminalRuleA) - Number(!!terminalRuleB);
                })
                .map((t) => {
                    const terminal = Grammar.stringify(t);
                    const terminalRule = this._terminalRules.find((r) => r.LHS === t);
                    const regex = terminalRule
                        ? `^${terminalRule.RHS[0]}`
                        : `^${terminal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
                    return [new RegExp(regex), t];
                })
        );
    }

    private computeFirstFollow() {
        let firstSets = {};
        let followSets = {};

        // Holds a map of the relevant grammar rules for FIRST and FOLLOW
        const firstRules = {};
        const followRules = {};

        const symbols = this._terminals.concat(this._nonTerminals).concat([EPSILON]);
        symbols.forEach((s) => {
            firstSets[s] = Set<string>();
            firstRules[s] = this._rules.filter((r) => r.LHS === s);

            // FOLLOW is only defined for non-terminals
            if (!Grammar.isTerminal(s)) {
                followSets[s] = Set<string>();
                followRules[s] = this._rules.filter((r) => r.RHS.includes(s));
            }
        });

        // FOLLOW(S) = { $ }
        followSets[this._startSymbol] = Set<string>([EOF]);

        // Computes FIRST(symbol)
        const firstOf = (symbol) => {
            // 1. If x is a terminal, then FIRST(x) = { ‘x’ }
            //
            // 2. If x-> Є, is a production rule, then add Є to FIRST(x).
            //
            // 3. If X->Y1 Y2 Y3….Yn is a production,
            //
            //      a) FIRST(X) = FIRST(Y1)
            //      b) If FIRST(Y1) contains Є then FIRST(X) = { FIRST(Y1) – Є } U { FIRST(Y2) }
            //      c) If FIRST (Yi) contains Є for all i = 1 to n, then add Є to FIRST(X).

            // Terminal symbol
            if (Grammar.isTerminal(symbol)) return Set<string>([symbol]);

            let firstSet = Set<string>();

            // Iterate through every rule that has the symbol in the left-hand side
            const rules = firstRules[symbol];
            for (const rule of rules) {
                // Loop over the RHS symbols of the rule
                // While ε is in their first set
                let first;
                let index = 0;
                do {
                    first = firstSets[rule.RHS[index]];

                    let tempSet = Set<string>(first);
                    tempSet.delete(EPSILON);

                    firstSet = firstSet.union<string>(tempSet);
                } while (first.has(EPSILON) && ++index && index < rule.RHS.length);

                // If all RHS symbols have ε in their first sets
                // Add ε to firstOf(symbol)
                if (index === rule.RHS.length) firstSet = firstSet.add(EPSILON);

                // If symbol => ε exists, add ε to firstOf(symbol)
                if (_.isEqual(rule.RHS, [EPSILON])) firstSet = firstSet.add(EPSILON);
            }

            // Save and return the computed first set
            return firstSet;
        };

        // Computes FOLLOW(symbol)
        const followOf = (symbol) => {
            // 1. FOLLOW(S) = { $ }   // where S is the starting Non-Terminal
            //
            // 2. If A -> pBq is a production, where p, B and q are any grammar symbols,
            //    then everything in FIRST(q)  except Є is in FOLLOW(B).
            //
            // 3. If A-> pB is a production, then everything in FOLLOW(A) is in FOLLOW(B).
            //
            // 4. If A-> pBq is a production and FIRST(q) contains Є,
            //    then FOLLOW(B) contains { FIRST(q) – Є } U FOLLOW(A)
            let followSet = Set<string>();

            // Find productions where symbol is in RHS
            const rules = followRules[symbol];
            for (const rule of rules) {
                // Symbol may occur multiple times in RHS
                // We need to loop over each occurrence
                rule.RHS.map((v, i) => [v, i + 1])
                    .filter(([v]) => v === symbol)
                    .forEach(([_, index]) => {
                        // Loop over the RHS symbols occurring after symbol
                        // While ε is in their first set
                        let first;
                        do {
                            // We've hit the end of the RHS of the rule
                            // So everything in FOLLOW(LHS) is also in FOLLOW(symbol)
                            if (index === rule.RHS.length) {
                                const follow = followSets[rule.LHS];
                                followSet = followSet.union<string>(follow);
                                break;
                            }

                            first = firstSets[rule.RHS[index]];

                            let tempSet = Set<string>(first);
                            tempSet.delete(EPSILON);

                            followSet = followSet.union<string>(tempSet);
                        } while (first.has(EPSILON) && ++index);
                    });
            }

            // Add $ to FOLLOW(S)
            if (symbol === this._startSymbol) followSet = followSet.add(EOF);

            // Remove epsilon and return the computed follow set
            followSet = followSet.delete(EPSILON);
            return followSet;
        };

        // Iterative algorithm
        // Start with baseline FIRST and FOLLOW sets (empty for non-terminals, FIRST(terminal) = { terminal })
        // Compute the next iteration based on the current FIRST and FOLLOW sets
        // Repeat until we compute the first iteration where NONE of the sets change
        // Algorithm MUST converge because there is a finite number of symbols in the grammar
        // This takes care of recursive rules
        let nextFirstSets = firstSets,
            nextFollowSets = followSets;
        do {
            firstSets = nextFirstSets;
            followSets = nextFollowSets;
            nextFirstSets = {};
            nextFollowSets = {};
            symbols.forEach((s) => {
                nextFirstSets[s] = firstOf(s);
                if (!Grammar.isTerminal(s)) nextFollowSets[s] = followOf(s);
            });
        } while (
            symbols.some(
                (s) =>
                    !nextFirstSets[s].equals(firstSets[s]) ||
                    (!Grammar.isTerminal(s) && !nextFollowSets[s].equals(followSets[s]))
            )
        );

        this._firstSets = firstSets;
        this._followSets = followSets;
    }

    public getStartSymbol() {
        return this._startSymbol;
    }

    public getSymbols() {
        if (this._terminals && this._nonTerminals)
            return Set.union<string>([this._terminals, this._nonTerminals]);

        let terminals = Set<string>([EOF]);
        let nonTerminals = Set<string>();
        this._rules.forEach((rule) => {
            nonTerminals = nonTerminals.add(rule.LHS);
            rule.RHS.forEach((s) => {
                if (Grammar.isTerminal(s)) terminals = terminals.add(s);
                else nonTerminals = nonTerminals.add(s);
            });
        });

        this._terminals = terminals.toArray().sort((a, b) => {
            const ruleIndexA = this._terminalRules.findIndex((r) => r.LHS === a);
            const ruleIndexB = this._terminalRules.findIndex((r) => r.LHS === b);
            return ruleIndexA - ruleIndexB;
        });
        this._nonTerminals = nonTerminals.toArray();
        return Set.union<string>([this._terminals, this._nonTerminals]);
    }

    public getRules() {
        return this._rules;
    }

    public getTerminals() {
        return this._terminals;
    }

    public getNonTerminals() {
        return this._nonTerminals;
    }

    public getTokenTypes() {
        return this._tokenTypes;
    }

    public getAugmentedStartSymbol() {
        return `${this._startSymbol}'`;
    }

    public getAugmentedGrammar() {
        const augmentedProduction = new GrammarRule(`${this.getAugmentedStartSymbol()}`, [
            this._startSymbol
        ]);
        const rules = [augmentedProduction, ...this._rules];
        return new Grammar(rules);
    }

    public firstOf(symbol: string): Set<string> {
        return this._firstSets[symbol];
    }

    public firstOfSequence(symbols: string[]) {
        // Base case, empty array means return set of EOF only
        if (symbols.length === 0) return Set<string>([EOF]);

        let firstSet = Set<string>();
        let first: Set<string> = Set<string>(),
            index = 0;

        do {
            first = this._firstSets[symbols[index++]] || Set<string>();
            firstSet = firstSet.union(first);
        } while (index < symbols.length && first.contains(EPSILON));

        if (index === symbols.length && first.contains(EPSILON)) {
            firstSet = firstSet.add(EOF);
        }

        return firstSet;
    }

    public followOf(symbol: string): Set<string> {
        return this._followSets[symbol];
    }

    public print(print: StringProcessor = DEFAULT_PROCESSOR) {
        print(`Grammar:\n`);

        print('\n    Start symbol:\n\n');
        print(`        ${this._startSymbol}\n`);

        print('\n    Rules:\n\n');
        this.getRules().forEach((r) => print(`        ${r.LHS} -> ${r.RHS.join(' ')}\n`));

        print('\n    Terminals:\n\n');
        this.getTerminals().forEach((t) => print(`        ${t}\n`));

        print('\n    Non-Terminals:\n\n');
        this.getNonTerminals().forEach((nt) => print(`        ${nt}\n`));

        print('\n    First sets:\n\n');
        this.getNonTerminals().forEach((nt) =>
            print(`        FIRST(${nt}) = { ${this.firstOf(nt).toJSON().join(', ')} }\n`)
        );

        print('\n    Follow sets:\n\n');
        this.getNonTerminals().forEach((nt) =>
            print(`        FOLLOW(${nt}) = { ${this.followOf(nt).toJSON().join(', ')} }\n`)
        );
    }

    public toString(): string {
        let grammarStr = '';
        const strProc = (str) => (grammarStr += str);
        this.print(strProc);
        return grammarStr;
    }

    public toJSMachineString(): string {
        return this._rules.map((r) => r.toJSMachineString()).join('\n');
    }

    public static isTerminal(symbol: string) {
        return symbol === EOF || symbol === EPSILON || /^'.*'$/.test(symbol);
    }

    public static stringify(symbol: string) {
        if (symbol === EOF || symbol === EPSILON) return symbol;
        return Grammar.isTerminal(symbol) ? symbol.substring(1, symbol.length - 1) : symbol;
    }
}
