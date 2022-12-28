import { Grammar, GrammarRule } from './grammar';
import { TokenInstance, Tokenizer, TokenizerFactory } from '../tokenizer';
import { ASTNode } from '../ast/ast-node';
import { DiagnosticProducer, PipelineStage } from '../pipeline';

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

export abstract class GrammarParser extends DiagnosticProducer implements PipelineStage {
    protected readonly _grammar: Grammar;
    protected readonly _augmentedGrammar: Grammar;

    protected constructor(grammar: Grammar) {
        super();
        this._grammar = grammar;
        this._augmentedGrammar = grammar.getAugmentedGrammar();
    }

    public execute(input: string) {
        return this.parseFile(input);
    }

    public parseString(input: string) {
        const tokenizer = TokenizerFactory.fromString(input, this._grammar.getTokenTypes());
        const derivation = this.parse(tokenizer);
        if (!derivation) return null;
        return this._createAST(derivation);
    }

    public parseFile(file: string) {
        const tokenizer = TokenizerFactory.fromFile(file, this._grammar.getTokenTypes());
        const derivation = this.parse(tokenizer);
        if (!derivation) return null;
        return this._createAST(derivation);
    }

    protected abstract parse(tokenizer: Tokenizer): DerivationNode | null;

    private _createAST(root: DerivationNode): ASTNode | null {
        if (!root) return null;

        if (Grammar.isTerminal(root.token.type)) return root.token;

        if (!root.rule) return undefined;

        const children = root.children.map((c) => this._createAST(c));
        if (!root.rule.reduction) {
            return {
                type: root.token.type,
                children
            };
        }

        try {
            return root.rule.reduction.apply(undefined, [root.rule.LHS, ...children]);
        } catch (err) {
            this.error(err.message);
            return null;
        }
    }
}
