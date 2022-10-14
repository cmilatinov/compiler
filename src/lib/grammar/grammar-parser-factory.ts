import { Grammar } from './grammar';
import { GrammarParser, GrammarParserType } from './grammar-parser';
import { GrammarParserLL1, GrammarParserLR0, GrammarParserLR1, GrammarParserSLR1 } from './parsers';

export class GrammarParserFactory {
    public static create(type: GrammarParserType, grammar: Grammar): GrammarParser {
        switch (type) {
            case GrammarParserType.LL1:
                return new GrammarParserLL1(grammar);
            case GrammarParserType.LR0:
                return new GrammarParserLR0(grammar);
            case GrammarParserType.SLR1:
                return new GrammarParserSLR1(grammar);
            case GrammarParserType.LR1:
                return new GrammarParserLR1(grammar);
        }
        throw new TypeError(`Unsupported grammar parser type ${type}.`);
    }
}
