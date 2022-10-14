import { LR0Item } from './items';
import { GrammarParserLR0 } from './grammar-parser-lr0';
import { LRParseTable } from './lr-parse-table';

export class GrammarParserSLR1 extends GrammarParserLR0 {
    protected _init(parseTable?: LRParseTable) {
        if (!parseTable) {
            this._collection = this._buildCanonicalCollection(LR0Item);
            this._parseTable = this._buildParseTable(this._collection, (g, i) =>
                g.followOf(i.rule.LHS).toJSON()
            );
        } else {
            this._parseTable = parseTable;
        }
    }
}
