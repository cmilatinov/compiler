import { DiagnosticProducer } from '../pipeline';
import { Address } from './address';

export abstract class CodeGeneratorASM extends DiagnosticProducer {
    private _code: string = '';

    private _generateCode(code: string) {
        this._code += code;
    }

    public line(code?: string) {
        this._generateCode(`${code || ''}\n`);
    }

    public comment(comment: string) {
        this._indent();
        this._generateCode(`; ${comment}\n`);
    }

    public instructionLabelled(label: string, instruction: string, dest?: string, src?: string) {
        this._indent(label);
        this._instructionInner(instruction, dest, src);
        this.line();
    }

    public instruction(instruction: string, dest?: string, src?: string) {
        this._indent();
        this._instructionInner(instruction, dest, src);
        this.line();
    }

    private _instructionInner(instruction: string, dest?: string, src?: string) {
        this._generateCode(
            `${instruction.padEnd(10)}${dest || ''}${!!dest && !!src ? ', ' : ''}${src || ''}`
        );
    }

    private _indent(label?: string) {
        this._generateCode((label ? `${label}:` : '').padEnd(15));
    }

    public abstract mov(dest: Address, src: Address);

    public get code() {
        return this._code;
    }
}
