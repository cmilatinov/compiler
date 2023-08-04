import _ from 'lodash';
import * as fs from 'fs';
import { Grammar, GrammarFactory, GrammarParser } from '../lib/grammar';
import { GrammarParserLR0, GrammarParserLR1, GrammarParserSLR1 } from '../lib/grammar/parsers';
import { printAST } from '../lib/ast/ast-utils';
import { GrammarParserLALR1 } from '../lib/grammar/parsers/grammar-parser-lalr1';

main();

function main() {
    const file = process.argv[2];
    if (!file) return;

    const grammar = GrammarFactory.fromGRMFile(file);

    const parser = new GrammarParserLALR1(grammar);
    console.log(grammar.getAugmentedGrammar().toJSMachineString());
    // console.log(parser.parseString(`A -> 'a';`));

    const table = parser.parseTable
        .toString()
        .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    fs.writeFileSync('parse_table.txt', table);
    // console.log(parser.parseTable.toString());

    // console.log();
    // const out = parser.parseString('id + id * id');
    // printAST(out);

    // console.log(parser.canonicalCollection.states.length);
    // const out = parser.parseString('(this++)(a,b,c)');
    // printAST(out);
    // const out = parser.parseString('a');
    // console.log(out);
    // console.log(grammar.toString());
    // console.log(parser.parseTable.toString());
}
