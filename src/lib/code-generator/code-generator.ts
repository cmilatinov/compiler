import { DiagnosticProducer } from '../pipeline';

export class CodeGenerator extends DiagnosticProducer {
    private _code: string = '';

    private _generateCode(code: string) {
        this._code += code;
    }

    protected _line(code?: string) {
        this._generateCode(`${code || ''}\n`);
    }

    protected _comment(comment: string) {
        this._indent();
        this._generateCode(`; ${comment}\n`);
    }

    protected _instructionLabelled(
        label: string,
        instruction: string,
        dest?: string,
        src?: string
    ) {
        this._indent(label);
        this._instructionInner(instruction, dest, src);
        this._line();
    }

    protected _instruction(instruction: string, dest?: string, src?: string) {
        this._indent();
        this._instructionInner(instruction, dest, src);
        this._line();
    }

    private _instructionInner(instruction: string, dest?: string, src?: string) {
        this._generateCode(
            `${instruction.padEnd(10)}${dest || ''}${!!dest && !!src ? ', ' : ''}${src || ''}`
        );
    }

    private _indent(label?: string) {
        this._generateCode((label ? `${label}:` : '').padEnd(15));
    }

    public get code() {
        return this._code;
    }
}
