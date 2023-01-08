import { SymbolTableGenerator } from './symbol-table/symbol-table-generator';
import { TypeChecker } from './type/type-checker';
import { ParsingPipeline } from '../lib/pipeline';
import { GrammarParserSLR1 } from '../lib/grammar/parsers';
import { GrammarFactory } from '../lib/grammar';
import { CodeGeneratorSCLangTAC } from './code-generator/tac/code-generator';
import { LRParseTable } from '../lib/grammar/parsers/lr-parse-table';
import { CodeGeneratorSCLangX64 } from './code-generator/x64';
import * as fs from 'fs';

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
            new CodeGeneratorSCLangTAC(),
            new CodeGeneratorSCLangX64()
        );
    }
}
