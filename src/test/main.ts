import '../sc-lang/type/type-specifier';
import { SCLangPipeline } from '../sc-lang/sc-lang-pipeline';
import { PRINT_DIAGNOSTICS } from '../lib/pipeline';
import { SymbolTable } from '../lib/symbol-table';
import { ASTNode } from '../lib/ast/ast-node';
import { InstructionBlock } from '../lib/tac';
import _ from 'lodash';

main();

function main() {
    const pipeline = new SCLangPipeline();
    pipeline.diagnosticCallback = PRINT_DIAGNOSTICS;
    pipeline.execute('./src/sc-lang/examples/simple.sc');
    console.log();
    console.log(pipeline['_stages'][3].toString());
    console.log();
}
