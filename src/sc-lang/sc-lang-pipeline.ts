import { SymbolTableGenerator } from './symbol-table/symbol-table-generator';
import { TypeChecker } from './type/type-checker';
import { ParsingPipeline } from '../lib/pipeline';
import { GrammarParserSLR1 } from '../lib/grammar/parsers';
import { GrammarFactory } from '../lib/grammar';
import { CodeGeneratorSCLang } from './code-generator/tac/code-generator';
import * as fs from 'fs';
import { LRParseTable } from '../lib/grammar/parsers/lr-parse-table';

export class SCLangPipeline extends ParsingPipeline {
    constructor() {
        super(
            new GrammarParserSLR1(
                GrammarFactory.fromGRMFile('./grammars/sc-lang.grm'),
                fs.existsSync(`./tables/sc-lang.json`)
                    ? LRParseTable.load('./tables/sc-lang.json')
                    : undefined
            ),
            new SymbolTableGenerator(),
            new TypeChecker(),
            new CodeGeneratorSCLang()
        );
    }
}
