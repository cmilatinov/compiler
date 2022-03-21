import * as fs from 'fs';
import { Set } from 'immutable';

import * as LibUtils from './utils';
import { ASTNode } from './ast-validator';
import { EPSILON, EOF } from './symbols';
import { TokenInstance, Tokenizer, TokenType, MultiLineCommentToken, SingleLineCommentToken, WhitespaceToken, TokenizerFactory } from './tokenizer';


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
        return `${this.LHS} -> ${this.RHS.map(s => Grammar.isTerminal(s) ? s.substring(1, s.length - 1) : s).join(' ')}`;
    }
}

export class DerivationNode {
    public token: TokenInstance;
    public children: DerivationNode[];
    public rule?: GrammarRule;

    public constructor(token, children, rule?) {
        this.token = token;
        this.children = children;
        this.rule = rule;
    }

    public toString(): string {
        const tokenType = Grammar.isTerminal(this.token.type) ? this.token.type.substring(1, this.token.type.length - 1) : this.token.type;
        return `[${tokenType}] ${this.token.location?.toString()} ${this.token.value !== tokenType ? this.token.value : ''}`;
    }
}

export class GrammarFactory {

    public static fromFile(file: string): Grammar {
        const grammarStr: string = fs.readFileSync(file).toString().replace(/\r\n/g, '\n');
        return this.fromString(grammarStr);
    }

    public static fromString(grammarStr: string): Grammar {
        const grammarRules: GrammarRule[] = [];

        grammarStr.split('\n').forEach(line => {
            line = line.trim();
            if (/^\s*$/.test(line)) {
                return;
            }

            const components = line.split(/->(.*)/).filter(c => c !== '');
            const LHS = components[0].trim();
            let RHS = components[1].trim();

            let RHSComponents = RHS.split(/{{(.*?)}}/);
            RHS = RHSComponents[0].trim();
            const reductionStr = RHSComponents[1]?.trim()
                .replace(/\$([0-9]+)/g, 'arguments[$1]')
                .replace(/\$\$/g, 'arguments[0]');
            const reduction = reductionStr ? new Function(reductionStr) : undefined;

            const terminals = Set<string>(RHS.match(/'[^']*'/g) || []).toArray();
            terminals.forEach((t, i) => RHS = RHS.replaceAll(t, `$${i}`));

            RHS.split('|').forEach(rhs => {
                const symbols = rhs.trim().split(/\s+/).map(symbol => {
                    terminals.forEach((t, i) => symbol = symbol.replace(`$${i}`, t))
                    return symbol;
                });
                if (symbols.length <= 0)
                    symbols.push(EPSILON);
                grammarRules.push(new GrammarRule(LHS, symbols, reduction));
            });
        });

        return new Grammar(grammarRules);
    }

}

export class Grammar {

    private readonly _rules: GrammarRule[];
    private readonly _terminalRules: GrammarRule[];
    private readonly _startSymbol: string;

    private _nonTerminals: string[];
    private _terminals: string[];
    private _firstSets: { [key: string]: Set<string>; };
    private _followSets: { [key: string]: Set<string>; };
    private _parsingTableLL1: object;
    private _tokenTypes: TokenType[];

    public constructor(rules: GrammarRule[]) {
        this._rules = rules.filter(r => !Grammar.isTerminal(r.LHS));
        this._terminalRules = rules.filter(r => Grammar.isTerminal(r.LHS));
        this._startSymbol = rules[0].LHS;
        this._firstSets = {};
        this._followSets = {};
        this.getSymbols();
        this.createTokenTypes();
        this.computeFirstFollow();
        this.buildParseTableLL1();
    }


    private createTokenTypes() {
        const terminals = this._terminals.filter(t => t !== EPSILON && t !== EOF);
        this._tokenTypes = [WhitespaceToken, SingleLineCommentToken, MultiLineCommentToken].concat(
            terminals.sort((a, b) => {
                const terminalRuleA = this._terminalRules.find(r => r.LHS === a);
                const terminalRuleB = this._terminalRules.find(r => r.LHS === b);
                return Number(!!terminalRuleA) - Number(!!terminalRuleB);
            })
                .map(t => {
                    const terminal = t.substring(1, t.length - 1);
                    const terminalRule = this._terminalRules.find(r => r.LHS === t);
                    const regex = terminalRule ?
                        `^${terminalRule.RHS[0].substring(1, terminalRule.RHS[0].length - 1)}` :
                        `^${terminal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`;
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
        symbols.forEach(s => {
            firstSets[s] = Set<string>();
            firstRules[s] = this._rules.filter(r => r.LHS === s);

            // FOLLOW is only defined for non-terminals
            if (!Grammar.isTerminal(s)) {
                followSets[s] = Set<string>();
                followRules[s] = this._rules.filter(r => r.RHS.includes(s));
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
            if (Grammar.isTerminal(symbol))
                return Set<string>([symbol]);

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
                } while(first.has(EPSILON) && ++index && index < rule.RHS.length);

                // If all RHS symbols have ε in their first sets
                // Add ε to firstOf(symbol)
                if (index === rule.RHS.length)
                    firstSet.add(EPSILON);

                // If symbol => ε exists, add ε to firstOf(symbol)
                if (rule.RHS.length === 1 && rule.RHS[0] === EPSILON)
                    firstSet.add(EPSILON);
            }

            // Save and return the computed first set
            return firstSet;
        }

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

                let index = rule.RHS.indexOf(symbol) + 1;

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
                } while(first.has(EPSILON) && ++index);


            }

            // Remove epsilon and return the computed follow set
            followSet = followSet.delete(EPSILON);
            return followSet;
        }

        // Iterative algorithm
        // Start with baseline FIRST and FOLLOW sets (empty for non-terminals, FIRST(terminal) = { terminal })
        // Compute the next iteration based on the current FIRST and FOLLOW sets
        // Repeat until we compute the first iteration where NONE of the sets change
        // Algorithm MUST converge because there is a finite number of symbols in the grammar
        // This takes care of recursive rules
        let nextFirstSets = firstSets, nextFollowSets = followSets;
        do {
            firstSets = nextFirstSets;
            followSets = nextFollowSets;
            nextFirstSets = {};
            nextFollowSets = {};
            symbols.forEach(s => {
                nextFirstSets[s] = firstOf(s);
                if (!Grammar.isTerminal(s))
                    nextFollowSets[s] = followOf(s);
            });
        } while(symbols.some(s => !nextFirstSets[s].equals(firstSets[s]) || (!Grammar.isTerminal(s) && !nextFollowSets[s].equals(followSets[s]))));

        this._firstSets = firstSets;
        this._followSets = followSets;
    }

    private buildParseTableLL1() {
        if (this._parsingTableLL1)
            return this._parsingTableLL1;

        this._parsingTableLL1 = {};

        for (let i = 0; i < this._nonTerminals.length; i++) {
            this._parsingTableLL1[this._nonTerminals[i]] = {};
        }

        let addRuleToTable = (nonTerminal: string, terminal: string, rule: GrammarRule) => {
            if (!this._parsingTableLL1[nonTerminal][terminal])
                this._parsingTableLL1[nonTerminal][terminal] = rule;
            else if (Array.isArray(this._parsingTableLL1[nonTerminal][terminal]))
                this._parsingTableLL1[nonTerminal][terminal].push(rule);
            else
                this._parsingTableLL1[nonTerminal][terminal] = [this._parsingTableLL1[nonTerminal][terminal], rule];
        }

        this._rules.forEach(r => {

            // Each rule gets added to every
            const first = this.firstOf(r.RHS[0]).delete(EPSILON);
            first.forEach(t => addRuleToTable(r.LHS, t, r));

            if (r.RHS.length === 1 && r.RHS[0] === EPSILON) {
                const follow = this.followOf(r.LHS);
                follow.forEach(t => addRuleToTable(r.LHS, t, r));
            }
        });

        return this._parsingTableLL1;
    }


    public getSymbols() {
        if (this._terminals && this._nonTerminals)
            return Set.union<string>([this._terminals, this._nonTerminals]);

        let terminals = Set<string>([EOF]);
        let nonTerminals = Set<string>();
        this._rules.forEach(rule => {
            nonTerminals = nonTerminals.add(rule.LHS);
            rule.RHS.forEach(s => {
                if (Grammar.isTerminal(s))
                    terminals = terminals.add(s);
                else
                    nonTerminals = nonTerminals.add(s);
            });
        });

        this._terminals = terminals.toArray();
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


    public firstOf(symbol) {
        return this._firstSets[symbol];
    }

    public followOf(symbol) {
        return this._followSets[symbol];
    }

    public isLL1() {
        for (let k1 in this._parsingTableLL1) {
            for (let k2 in this._parsingTableLL1[k1]) {
                if (Array.isArray(this._parsingTableLL1[k1][k2]))
                    return false;
            }
        }
        return true;
    }


    public parseString(input: string, printErr: (str) => void = str => process.stdout.write(str)) {
        const tokenizer = TokenizerFactory.fromString(input, this._tokenTypes);
        return this.parse(tokenizer, printErr);
    }

    public parseFile(file: string, printErr: (str) => void = str => process.stdout.write(str)) {
        const tokenizer = TokenizerFactory.fromFile(file, this._tokenTypes);
        return this.parse(tokenizer, printErr);
    }

    public parse(tokenizer: Tokenizer, printErr: (str) => void = str => process.stdout.write(str)): DerivationNode {
        const root = new DerivationNode(
            {
                type: this._startSymbol,
                value: this._startSymbol,
                location: tokenizer.getCursorLocation()
            },
            []
        );
        const stack: DerivationNode[] = [
            new DerivationNode({ type: EOF, value: EOF }, []),
            root
        ];
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
                        printErr(`${err.message}`);
                    }
                }

            } else {
                const rule = this._parsingTableLL1[node.token.type] ? this._parsingTableLL1[node.token.type][lookahead.type] : undefined;
                if (!rule) {
                    if (this.firstOf(node.token.type).has(EPSILON))
                        continue;
                    printErr(`${lookahead.location.toString()} Unexpected token '${Grammar.stringify(lookahead.type)}', expected '${Grammar.stringify(node.token.type)}'.`);
                    return null;
                } else if (Array.isArray(rule)) {
                    printErr(`${lookahead.location.toString()} Unexpected token '${Grammar.stringify(lookahead.type)}', expected '${Grammar.stringify(node.token.type)}'.`);
                    printErr(`Multiple reduction rules found:`);
                    rule.forEach(r => printErr(`     ${r.toString()}`));
                    return null;
                }

                const production = rule.RHS.filter(s => s !== EPSILON).reverse()
                    .map(s => new DerivationNode({ type: s, value: s, location: lookahead.location }, []));
                stack.push(...production);
                node.token.location = lookahead.location;
                node.children = production.reverse();
                node.rule = rule;
            }
        }

        return root;
    }

    public createAST(root: DerivationNode): ASTNode {
        if (Grammar.isTerminal(root.token.type))
            return root.token as unknown as ASTNode;

        if (!root.rule)
            return undefined;

        const children = root.children.map(c => this.createAST(c));
        if (!root.rule.reduction)
            return {
                type: root.token.type,
                children
            };

        return root.rule.reduction.apply(undefined, [root.rule.LHS, ...children]);
    }

    public printParseTable(print: (str) => void = (str => process.stdout.write(str))) {
        const tableObject = {};
        Object.keys(this._parsingTableLL1).forEach(k => {
            tableObject[k] = {};
            Object.keys(this._parsingTableLL1[k]).forEach(j => tableObject[k][j] = this._parsingTableLL1[k][j]?.toString());
        });
        const table = LibUtils.stringTable(tableObject);
        print(table);
    }

    public print(print: (str) => void = str => process.stdout.write(str)) {
        print(`Grammar:\n`);

        print('\n    Start symbol:\n\n')
        print(`        ${this._startSymbol}\n`);

        print('\n    Rules:\n\n');
        this.getRules().forEach(r => print(`        ${r.LHS} -> ${r.RHS.join(' ')}\n`));

        print('\n    Terminals:\n\n');
        this.getTerminals().forEach(t => print(`        ${t}\n`));

        print('\n    Non-Terminals:\n\n');
        this.getNonTerminals().forEach(nt => print(`        ${nt}\n`));

        print('\n    First sets:\n\n');
        this.getNonTerminals().forEach(nt => print(`        FIRST(${nt}) = { ${this.firstOf(nt).toJS().join(', ')} }\n`));

        print('\n    Follow sets:\n\n');
        this.getNonTerminals().forEach(nt => print(`        FOLLOW(${nt}) = { ${this.followOf(nt).toJS().join(', ')} }\n`));

        print('\n');
        print(`The grammar is${!this.isLL1() ? ' not' : ''} LL(1).\n`);
    }


    public static isTerminal(symbol: string) {
        return symbol === EOF || symbol === EPSILON || /^'.*'$/.test(symbol);
    }

    public static printDerivationTree(node: DerivationNode, print: (str) => void = str => process.stdout.write(str), indent = '', last = true) {
        if (node === null)
            return;

        print(indent);

        if (last) {
            print("└───");
            indent += "    ";
        } else {
            print("├───");
            indent += "│   ";
        }
        print(node.toString());
        print('\n');

        for (let i = 0; i < node.children.length; i++) {
            this.printDerivationTree(node.children[i], print, indent, i == node.children.length - 1);
        }
    }

    public static stringify(symbol: string) {
        return Grammar.isTerminal(symbol) ? symbol.substring(1, symbol.length - 1) : symbol;
    }

}

