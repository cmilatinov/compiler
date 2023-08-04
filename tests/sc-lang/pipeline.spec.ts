import { SCLangPipeline } from '../../src/sc-lang/sc-lang-pipeline';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { Diagnostic } from '../../src/lib/pipeline';

describe('sc-lang pipeline tests', () => {
    const src = path.join(__dirname, 'src');
    const build = path.join(__dirname, 'build');

    function compile(filename: string) {
        const srcFile = path.join(src, `${filename}.sc`);
        const asm = path.join(build, `${filename}.asm`);
        const tac = path.join(build, `${filename}.tac`);
        const pipeline = new SCLangPipeline();
        const diagnostics: Diagnostic[] = [];
        pipeline.diagnosticCallback = (diag) => diagnostics.push(diag);
        const code = pipeline.execute(srcFile);
        if (!code) {
            throw new Error(
                `Failed to compile '${filename}.sc':\n` +
                    `${diagnostics
                        .map((d) => `[${d.type.toUpperCase()}] ${d.location} ${d.message}`)
                        .join('\n')}`
            );
        }
        fs.writeFileSync(asm, code);
        fs.writeFileSync(tac, pipeline['_stages'][3].toString());
        execSync(`make build/${filename}`, { cwd: __dirname });
    }

    function run(program: string) {
        return execSync(path.join(build, program)).toString();
    }

    function createTest(program: string) {
        it(program, () => {
            compile(program);
            const output = run(program);
            const expected = fs.readFileSync(path.join(src, `${program}.out`)).toString();
            expect(output).toEqual(expected);
        });
    }

    beforeAll(() => {
        fs.mkdirSync(build, { recursive: true });
    });

    createTest('printf');

    createTest('integers');
    createTest('integers_simple');
    createTest('integers_complex');

    // createTest('floats');

    afterAll(() => {
        // execSync(`make clean`, { cwd: __dirname });
    });
});
