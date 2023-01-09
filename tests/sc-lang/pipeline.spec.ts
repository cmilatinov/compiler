import { SCLangPipeline } from '../../src/sc-lang/sc-lang-pipeline';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('sc-lang pipeline tests', () => {
    const src = path.join(__dirname, 'src');
    const build = path.join(__dirname, 'build');
    const pipeline = new SCLangPipeline();

    function compile(filename) {
        const srcFile = path.join(src, `${filename}.sc`);
        const asm = path.join(build, `${filename}.asm`);
        const obj = path.join(build, `${filename}.o`);
        const exe = path.join(build, filename);

        fs.mkdirSync(build, { recursive: true });
        let code = pipeline.execute(srcFile);
        code = `global main\n\nsection .text\n\n${code}`;
        fs.writeFileSync(asm, code);

        execSync(`nasm -g -felf64 ${asm} && gcc -g -m64 ${obj} -o ${exe}`);

        return exe;
    }

    it('integer calculations', () => {
        try {
            execSync(compile('integers'));
        } catch (err) {
            expect(err.status).toEqual(39);
        }
    });

    afterAll(() => {
        fs.rmSync(build, { recursive: true });
    });
});
