import { DerivationNode, GrammarParser } from '../grammar-parser';
import { Tokenizer } from '../../tokenizer';
import { StringProcessor } from '../../string-processor';
import { Grammar } from '../grammar';
import { LR1Item } from './items/lr1-item';
import { CanonicalCollection } from './collection/canonical-collection';
import { ParseTable } from './lr-parse-table';
import { GrammarParserLR } from './grammar-parser-lr';

export class GrammarParserLR1 extends GrammarParser {
    protected _collection: CanonicalCollection<LR1Item>;
    protected _parseTable: ParseTable;

    constructor(grammar: Grammar) {
        super(grammar);
        this.init();
    }

    protected init() {
        this._collection = GrammarParserLR.buildCanonicalCollection(LR1Item, this._grammar);
        this._parseTable = GrammarParserLR.buildParseTable(
            this._grammar,
            this._collection,
            (_, i) => i.lookaheads.toJSON()
        );
    }

    protected parse(tokenizer: Tokenizer, printErr: StringProcessor): DerivationNode {
        return GrammarParserLR.parse(this._grammar, this._parseTable, tokenizer, printErr);
    }

    public getParseTable(): ParseTable {
        return this._parseTable;
    }

    public getCanonicalCollection(): CanonicalCollection<LR1Item> {
        return this._collection;
    }
}
