import '../sc-lang/type/type-specifier';
import { SCLangPipeline } from '../sc-lang/sc-lang-pipeline';
import { PRINT_DIAGNOSTICS } from '../lib/pipeline';
import { printAST } from '../lib/ast/ast-utils';
// import * as fs from 'fs';
// import { printAST } from '../lib/ast/ast-utils';
// import * as util from 'util';

main();

function main() {
    const pipeline = new SCLangPipeline();
    pipeline.diagnosticCallback = PRINT_DIAGNOSTICS;

    const output = pipeline.execute('./tests/sc-lang/src/integers.sc');
    console.log();
    console.log(pipeline['_stages'][3].toString());
    console.log();

    console.log(output);

    // if (code) {
    //     console.log(code);
    //     fs.mkdirSync('./build', { recursive: true });
    //     fs.writeFileSync('./build/code.asm', code);
    // }
}
