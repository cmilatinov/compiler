import { Set } from 'immutable';
import { LR0Item } from './items';
import { GrammarParserLR0 } from './grammar-parser-lr0';

export class GrammarParserSLR1 extends GrammarParserLR0 {
    protected _init() {
        this._collection = this._buildCanonicalCollection(LR0Item);
        this._parseTable = this._buildParseTable(
            this._collection,
            (i) => this._grammar.followOf(i.rule.LHS) || Set<string>()
        );
    }
}
