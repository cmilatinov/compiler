import { Set } from 'immutable';

export enum InstructionTAC {
    ASSIGNMENT,
    COPY,
    CONDITIONAL_JUMP,
    JUMP,
    PARAMETER,
    PROCEDURE_CALL,
    RETURN,
    DECLARE,
    ALLOCATE,
    FREE,
    FUNCTION,
    END_FUNCTION
}

export interface BaseInstructionTAC {
    type: InstructionTAC;
    operands: { [key: string]: any };
    live: { in: Set<string>; out: Set<string> };
    toString(): string;
    getVariablesRead(): Set<string>;
    getVariablesWritten(): Set<string>;
}

export function isVariable(name: string) {
    if (!name || typeof name !== 'string') return false;
    return /^[_a-zA-Z]/.test(name);
}

export class AssignmentInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.ASSIGNMENT;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(
        public operands: {
            assignmentTarget: string;
            left?: string;
            operator: string;
            right: string;
        }
    ) {}

    public toString() {
        return `${this.operands.assignmentTarget} = ${
            this.operands.left ? `${this.operands.left} ` : ''
        }${this.operands.operator} ${this.operands.right}`;
    }

    public getVariablesRead() {
        const vars = [];
        if (isVariable(this.operands.left)) vars.push(this.operands.left);
        if (isVariable(this.operands.right)) vars.push(this.operands.right);
        return Set<string>(vars);
    }

    public getVariablesWritten() {
        return Set<string>([this.operands.assignmentTarget]);
    }
}

export class CopyInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.COPY;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(
        public operands: {
            dest: string;
            src: string;
        }
    ) {}

    public toString() {
        return `${this.operands.dest} = ${this.operands.src}`;
    }

    public getVariablesRead() {
        return isVariable(this.operands.src) ? Set<string>([this.operands.src]) : Set<string>();
    }

    public getVariablesWritten() {
        return Set<string>([this.operands.dest]);
    }
}

export class ConditionalJumpInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.CONDITIONAL_JUMP;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(
        public operands: {
            left?: string;
            operator: string;
            right: string;
            jumpTarget: InstructionBlock;
        }
    ) {}

    public toString() {
        return (
            `if ${this.operands.left ? `${this.operands.left} ` : ''}${this.operands.operator} ` +
            `${this.operands.right} then goto ${this.operands.jumpTarget?.label || '__'}`
        );
    }

    public getVariablesRead() {
        const vars = [];
        if (isVariable(this.operands.left)) vars.push(this.operands.left);
        if (isVariable(this.operands.right)) vars.push(this.operands.right);
        return Set<string>(vars);
    }

    public getVariablesWritten() {
        return Set<string>();
    }
}

export class JumpInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.JUMP;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(
        public operands: {
            jumpTarget: InstructionBlock;
        }
    ) {}

    public toString() {
        return `goto ${this.operands.jumpTarget?.label || '__'}`;
    }

    public getVariablesRead() {
        return Set<string>();
    }

    public getVariablesWritten() {
        return Set<string>();
    }
}

export class ParameterInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.PARAMETER;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(
        public operands: {
            parameter: string;
        }
    ) {}

    public toString() {
        return `param ${this.operands.parameter}`;
    }

    public getVariablesRead() {
        return isVariable(this.operands.parameter)
            ? Set<string>([this.operands.parameter])
            : Set<string>();
    }

    public getVariablesWritten() {
        return Set<string>();
    }
}

export class ProcedureCallInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.PROCEDURE_CALL;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(
        public operands: {
            procedureTarget: InstructionBlock;
            returnValueTarget?: string;
        }
    ) {}

    public toString() {
        return (
            `${this.operands.returnValueTarget ? `${this.operands.returnValueTarget} = ` : ''}` +
            `call ${this.operands.procedureTarget?.label || '__'}`
        );
    }

    public getVariablesRead() {
        return Set<string>();
    }

    public getVariablesWritten() {
        return this.operands.returnValueTarget
            ? Set<string>([this.operands.returnValueTarget])
            : Set<string>();
    }
}

export class ReturnInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.RETURN;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(
        public operands: {
            value?: string;
        }
    ) {}

    public toString() {
        return `return${this.operands.value ? ` ${this.operands.value}` : ''}`;
    }

    public getVariablesRead() {
        return isVariable(this.operands.value) ? Set<string>([this.operands.value]) : Set<string>();
    }

    public getVariablesWritten() {
        return Set<string>();
    }
}

export class FunctionInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.FUNCTION;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(public operands: { label: string }) {}

    public toString() {
        return `function ${this.operands.label}`;
    }

    public getVariablesRead() {
        return Set<string>();
    }

    public getVariablesWritten() {
        return Set<string>();
    }
}

export class EndFunctionInstruction implements BaseInstructionTAC {
    public readonly type = InstructionTAC.END_FUNCTION;
    public readonly live = { in: Set<string>(), out: Set<string>() };

    constructor(public operands: { label: string }) {}

    public toString() {
        return `endfunction ${this.operands.label}`;
    }

    public getVariablesRead() {
        return Set<string>();
    }

    public getVariablesWritten() {
        return Set<string>();
    }
}

export interface InstructionBlock {
    label?: string;
    instructions: BaseInstructionTAC[];
    control: { prev: InstructionBlock[]; next: InstructionBlock[] };
    live: Set<string>;
    next?: InstructionBlock;
}
