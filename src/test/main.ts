import '../sc-lang/type/type-specifier';
import { SCLangPipeline } from '../sc-lang/sc-lang-pipeline';
import { PRINT_DIAGNOSTICS } from '../lib/pipeline';
import * as fs from 'fs';

main();

function main() {
    const pipeline = new SCLangPipeline();
    pipeline.diagnosticCallback = PRINT_DIAGNOSTICS;

    const code = pipeline.execute('./tests/sc-lang/src/test.sc');
    console.log();
    console.log(pipeline['_stages'][3].toString());
    console.log();

    console.log(pipeline['_stages'][0].toString());

    const asmContent = `global main\n\nsection .text\n\n${code}`;
    console.log(asmContent);
    fs.mkdirSync('./build', { recursive: true });
    fs.writeFileSync('./build/code.asm', asmContent);
}
