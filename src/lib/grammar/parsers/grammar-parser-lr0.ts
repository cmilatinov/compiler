import { LRParseTable } from './lr-parse-table';
import { LR0Item } from './items';
import { GrammarParserLR } from './grammar-parser-lr';

export class GrammarParserLR0 extends GrammarParserLR<LR0Item> {
    protected _init(parseTable?: LRParseTable) {
        if (!parseTable) {
            this._collection = this._buildCanonicalCollection(LR0Item);
            this._parseTable = this._buildParseTable(this._collection, (g) => g.getTerminals());
        } else {
            this._parseTable = parseTable;
        }
    }
}
