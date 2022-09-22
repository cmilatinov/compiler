import { DerivationNode, GrammarParser } from '../grammar-parser';
import { Tokenizer } from '../../tokenizer';
import { StringProcessor } from '../../string-processor';
import { CanonicalCollection } from './collection/canonical-collection';
import { ParseTable } from './lr-parse-table';
import { LR0Item } from './items/lr0-item';
import { Grammar } from '../grammar';
import { GrammarParserLR } from './grammar-parser-lr';

export class GrammarParserLR0 extends GrammarParser {
    protected _collection: CanonicalCollection<LR0Item>;
    protected _parseTable: ParseTable;

    constructor(grammar: Grammar) {
        super(grammar);
        this.init();
    }

    protected init() {
        this._collection = GrammarParserLR.buildCanonicalCollection(LR0Item, this._grammar);
        this._parseTable = GrammarParserLR.buildParseTable(this._grammar, this._collection, (g) =>
            g.getTerminals()
        );
    }

    protected parse(tokenizer: Tokenizer, printErr: StringProcessor): DerivationNode {
        return GrammarParserLR.parse(this._grammar, this._parseTable, tokenizer, printErr);
    }

    public getParseTable(): ParseTable {
        return this._parseTable;
    }

    public getCanonicalCollection(): CanonicalCollection<LR0Item> {
        return this._collection;
    }
}
