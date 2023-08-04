import { LR1Item } from './items';
import { LRParseTable } from './lr-parse-table';
import { GrammarParserLR } from './grammar-parser-lr';

export class GrammarParserLR1 extends GrammarParserLR<LR1Item> {
    protected _init(parseTable?: LRParseTable) {
        this._collection = this._buildCanonicalCollection(LR1Item);
        this._parseTable = this._buildParseTable(this._collection, (i) => i.lookaheads);
    }
}
