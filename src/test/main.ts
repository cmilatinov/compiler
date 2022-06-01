import { Grammar, GrammarFactory, GrammarRule } from '../lib/grammar/grammar';
import { GrammarParserFactory } from '../lib/grammar/grammar-parser-factory';
import { GrammarParser, GrammarParserType } from '../lib/grammar/grammar-parser';
import { printAST } from '../ast/utils';

import * as fs from 'fs';
import { GrammarParserLR1 } from '../lib/grammar/parsers/grammar-parser-lr1';
import { GrammarParserSLR1 } from '../lib/grammar/parsers/grammar-parser-slr';
import { OrderedSet } from 'immutable';
import { GrammarParserLR0 } from '../lib/grammar/parsers/grammar-parser-lr0';
import { ParseTable, ParseTableAction, ParseTableActionType } from '../lib/grammar/parsers/lr-parse-table';
import { EPSILON } from '../lib/symbols';

main();

function main() {
    console.time('parsing grammar');
    const grammar = GrammarFactory.fromFile('./grammars/sc-lang.grm');
    // const grammar = GrammarFactory.fromJSONFile('./grammars/grm-lang.json');
    console.timeEnd('parsing grammar');

    console.time('parsing table generation');
    const grammarParser = new GrammarParserSLR1(grammar);
    console.timeEnd('parsing table generation');
    // console.log(grammarParser.getParseTable().toString());

    // console.time('write parse table to file');
    // fs.writeFileSync('./parse-table1.txt', grammarParser.getParseTable().toString());
    // console.timeEnd('write parse table to file');

    console.time('parsing string');
    const derivation = grammarParser.parseString(`
def test(a: int&&, b: int[1][2]&) -> bool {
    return false;
}

def main() { 
    const a: string = " asd", b: int[][]&& = 0, c: int*** = null; 
    *&a; 
    a.?b(1, 23, 'asdasd')[0]['asdasda']; 
    a ??= true ? 'true' : 'false'; 
    let abc: int = -(2 ^^ 2);
    b = test ?? new CoolBeans();
}`);
    const ast = grammarParser.createAST(derivation);
    printAST(ast);
    console.timeEnd('parsing string');
}
