import '../sc-lang/type/type-specifier';

import { GrammarFactory } from '../lib/grammar/grammar';
import * as ASTUtils from '../lib/ast/ast-utils';
import * as GrammarUtils from '../lib/grammar/grammar-utils';
import { GrammarParserSLR1 } from '../lib/grammar/parsers/grammar-parser-slr';
import { SCLangPipeline } from '../sc-lang/sc-lang-pipeline';

main();

function main() {
    console.time('parsing grammar');
    const grammar = GrammarFactory.fromFile('./grammars/sc-lang.grm');
    // console.log(grammar.getAugmentedGrammar().toJSMachineString());
    console.timeEnd('parsing grammar');

    console.time('parsing table generation');
    const grammarParser = new GrammarParserSLR1(grammar);
    // console.log(grammarParser.getParseTable().getNumConflicts());
    console.timeEnd('parsing table generation');

    console.time('parsing string');
    const derivation = grammarParser.parseString(
        `def main ( ) { let a = 0 ; for ( a = 0 ; a < 3 ; i ++ ) { } }`
    );
    if (!derivation) return;
    GrammarUtils.printDerivationTree(derivation);
    // console.log(grammar.getAugmentedGrammar().toJSMachineString());
    // console.log(grammarParser.getParseTable().toString());
    const ast = grammarParser.createAST(derivation);
    console.timeEnd('parsing string');

    console.time('ast validation');
    const pipeline = new SCLangPipeline();
    console.log(pipeline.validate(ast));
    ASTUtils.printAST(ast);
    console.timeEnd('ast validation');
}
