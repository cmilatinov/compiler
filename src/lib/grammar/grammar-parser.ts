import { Grammar, GrammarRule } from './grammar';
import { DEFAULT_PROCESSOR, StringProcessor } from '../string-processor';
import { TokenInstance, Tokenizer, TokenizerFactory } from '../tokenizer';
import { ASTNode } from '../ast/ast-node';

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
        const tokenType = Grammar.isTerminal(this.token.type) ? this.token.type.substring(1, this.token.type.length - 1) : this.token.type;
        return `[${tokenType}] ${this.token.location?.toString()} ${this.token.value !== tokenType ? this.token.value : ''}`;
    }
}

export abstract class GrammarParser {

    protected readonly _grammar: Grammar;

    protected constructor(grammar: Grammar) {
        this._grammar = grammar;
    }

    public parseString(input: string, printErr: StringProcessor = DEFAULT_PROCESSOR) {
        const tokenizer = TokenizerFactory.fromString(input, this._grammar.getTokenTypes());
        return this.parse(tokenizer, printErr);
    }

    public parseFile(file: string, printErr: StringProcessor = DEFAULT_PROCESSOR) {
        const tokenizer = TokenizerFactory.fromFile(file, this._grammar.getTokenTypes());
        return this.parse(tokenizer, printErr);
    }

    protected abstract parse(tokenizer: Tokenizer, printErr: StringProcessor) : DerivationNode;

    public createAST(root: DerivationNode): ASTNode {
        if (Grammar.isTerminal(root.token.type))
            return root.token;

        if (!root.rule)
            return undefined;

        const children = root.children.map(c => this.createAST(c));
        if (!root.rule.reduction)
            return {
                type: root.token.type,
                children
            };

        try {
            return root.rule.reduction.apply(undefined, [root.rule.LHS, ...children]);
        } catch (err) {
            console.error(err);
            return null;
        }
    }


    public static printDerivationTree(node: DerivationNode, print: StringProcessor = DEFAULT_PROCESSOR, indent = '', last = 2) {
        if (node === null)
            return;

        print(indent);

        switch (last) {
            case 0:
                print("├───");
                indent += "│   ";
                break;
            case 1:
                print("└───");
                indent += "    ";
                break;
        }

        print(node.toString());
        print('\n');

        for (let i = 0; i < node.children.length; i++) {
            this.printDerivationTree(node.children[i], print, indent, i == node.children.length - 1 ? 1 : 0);
        }
    }

}


