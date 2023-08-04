import { Set } from 'immutable';
import { LR0Item } from './items';
import { GrammarParserLR } from './grammar-parser-lr';

export class GrammarParserLR0 extends GrammarParserLR<LR0Item> {
    protected _init() {
        this._collection = this._buildCanonicalCollection(LR0Item);
        this._parseTable = this._buildParseTable(this._collection, () =>
            Set<string>(this._grammar.getTerminals())
        );
    }
}
