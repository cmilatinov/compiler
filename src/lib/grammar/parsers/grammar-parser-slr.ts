import { LR0Item } from './items/lr0-item';
import { Grammar } from '../grammar';
import { GrammarParserLR0 } from './grammar-parser-lr0';
import { GrammarParserLR } from './grammar-parser-lr';

export class GrammarParserSLR1 extends GrammarParserLR0 {

    constructor(grammar: Grammar) {
        super(grammar);
    }

    protected init() {
        this._collection = GrammarParserLR.buildCanonicalCollection(LR0Item, this._grammar);
        this._parseTable = GrammarParserLR.buildParseTable(
            this._grammar,
            this._collection,
            (g, i) => g.followOf(i.rule.LHS).toJSON()
        );
    }

}