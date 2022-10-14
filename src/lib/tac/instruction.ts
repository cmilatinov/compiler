export enum Instruction {
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
    FUNCTION
}

export interface BaseInstruction {
    type: Instruction;
    operands: { [key: string]: any };
    toString(): string;
}

export class AssignmentInstruction implements BaseInstruction {
    public readonly type = Instruction.ASSIGNMENT;

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
}

export class CopyInstruction implements BaseInstruction {
    public readonly type = Instruction.COPY;

    constructor(
        public operands: {
            dest: string;
            src: string;
        }
    ) {}

    public toString() {
        return `${this.operands.dest} = ${this.operands.src}`;
    }
}

export class ConditionalJumpInstruction implements BaseInstruction {
    public readonly type = Instruction.CONDITIONAL_JUMP;

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
}

export class JumpInstruction implements BaseInstruction {
    public readonly type = Instruction.JUMP;

    constructor(
        public operands: {
            jumpTarget: InstructionBlock;
        }
    ) {}

    public toString() {
        return `goto ${this.operands.jumpTarget?.label || '__'}`;
    }
}

export class ParameterInstruction implements BaseInstruction {
    public readonly type = Instruction.PARAMETER;

    constructor(
        public operands: {
            parameter: string;
        }
    ) {}

    public toString() {
        return `param ${this.operands.parameter}`;
    }
}

export class ProcedureCallInstruction implements BaseInstruction {
    public readonly type = Instruction.PROCEDURE_CALL;

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
}

export class ReturnInstruction implements BaseInstruction {
    public readonly type = Instruction.RETURN;

    constructor(
        public operands: {
            value?: string;
        }
    ) {}

    public toString() {
        return `return${this.operands.value ? ` ${this.operands.value}` : ''}`;
    }
}

export class DeclareInstruction implements BaseInstruction {
    public readonly type = Instruction.DECLARE;

    constructor(public operands: { targetVariable: string }) {}

    public toString() {
        return `decl ${this.operands.targetVariable}`;
    }
}

export class AllocateInstruction implements BaseInstruction {
    public readonly type = Instruction.ALLOCATE;

    constructor(public operands: { targetTemporary: string }) {}

    public toString() {
        return `alloc ${this.operands.targetTemporary}`;
    }
}

export class FreeInstruction implements BaseInstruction {
    public readonly type = Instruction.FREE;

    constructor(public operands: { targetIdentifier: string }) {}

    public toString() {
        return `free ${this.operands.targetIdentifier}`;
    }
}

export class FunctionInstruction implements BaseInstruction {
    public readonly type = Instruction.FUNCTION;

    constructor(public operands: { label: string }) {}

    public toString() {
        return `function ${this.operands.label}`;
    }
}

export interface InstructionBlock {
    label?: string;
    instructions: BaseInstruction[];
    next?: InstructionBlock;
}
