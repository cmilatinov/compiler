import { Grammar, GrammarRule } from './grammar';
import { StringProcessor } from '../string-processor';
import { TokenInstance, Tokenizer, TokenizerFactory } from '../tokenizer';
import { ASTNode } from '../ast/ast-node';
import { DEFAULT_ERROR_PROCESSOR } from '../ast/ast-validator';

export enum GrammarParserType {
    LL1,
    LR0,
    SLR1,
    LR1
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
        const tokenType = Grammar.isTerminal(this.token.type)
            ? this.token.type.substring(1, this.token.type.length - 1)
            : this.token.type;
        return `[${tokenType}] ${this.token.location?.toString()} ${
            this.token.value !== tokenType ? this.token.value : ''
        }`;
    }
}

export abstract class GrammarParser {
    protected readonly _grammar: Grammar;
    protected readonly _augmentedGrammar: Grammar;

    protected constructor(grammar: Grammar) {
        this._grammar = grammar;
        this._augmentedGrammar = grammar.getAugmentedGrammar();
    }

    public parseString(input: string, printErr: StringProcessor = DEFAULT_ERROR_PROCESSOR) {
        const tokenizer = TokenizerFactory.fromString(input, this._grammar.getTokenTypes());
        return this.parse(tokenizer, printErr);
    }

    public parseFile(file: string, printErr: StringProcessor = DEFAULT_ERROR_PROCESSOR) {
        const tokenizer = TokenizerFactory.fromFile(file, this._grammar.getTokenTypes());
        return this.parse(tokenizer, printErr);
    }

    protected abstract parse(tokenizer: Tokenizer, printErr: StringProcessor): DerivationNode;

    public createAST(root: DerivationNode): ASTNode {
        if (!root) return null;

        if (Grammar.isTerminal(root.token.type)) return root.token;

        if (!root.rule) return undefined;

        const children = root.children.map((c) => this.createAST(c));
        if (!root.rule.reduction) {
            return {
                type: root.token.type,
                children
            };
        }

        try {
            return root.rule.reduction.apply(undefined, [root.rule.LHS, ...children]);
        } catch (err) {
            console.error(err);
            return null;
        }
    }
}
