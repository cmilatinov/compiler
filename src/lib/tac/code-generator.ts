import {
    AllocateInstruction,
    AssignmentInstruction,
    BaseInstruction,
    ConditionalJumpInstruction,
    CopyInstruction,
    DeclareInstruction,
    FreeInstruction,
    FunctionInstruction,
    InstructionBlock,
    JumpInstruction,
    ParameterInstruction,
    ProcedureCallInstruction,
    ReturnInstruction
} from './instruction';
import { DiagnosticProducer } from '../pipeline';

export class CodeGenerator extends DiagnosticProducer {
    private readonly _blocks: InstructionBlock[] = [];
    private _currentBlock: InstructionBlock;

    protected _block(label?: string, standalone: boolean = false) {
        const block: InstructionBlock = {
            label,
            instructions: []
        };
        if (!standalone && this._currentBlock) {
            this._currentBlock.next = block;
        }
        this._blocks.push(block);
        this._currentBlock = block;
        return block;
    }

    protected _instruction<T extends BaseInstruction>(
        type: { new (operands: T['operands']): T },
        operands: T['operands']
    ): T {
        const instruction = new type(operands);
        this._currentBlock.instructions.push(instruction);
        return instruction;
    }

    protected _assign(target: string, operator: string, right: string, left?: string) {
        return this._instruction(AssignmentInstruction, {
            assignmentTarget: target,
            operator,
            left,
            right
        });
    }

    protected _copy(dest: string, src: string) {
        return this._instruction(CopyInstruction, { src, dest });
    }

    protected _condJump(target: InstructionBlock, operator: string, right: string, left?: string) {
        return this._instruction(ConditionalJumpInstruction, {
            jumpTarget: target,
            operator,
            left,
            right
        });
    }

    protected _jump(target: InstructionBlock) {
        return this._instruction(JumpInstruction, { jumpTarget: target });
    }

    protected _param(parameter: string) {
        return this._instruction(ParameterInstruction, { parameter });
    }

    protected _call(target: InstructionBlock, returnValue?: string) {
        return this._instruction(ProcedureCallInstruction, {
            procedureTarget: target,
            returnValueTarget: returnValue
        });
    }

    protected _return(value?: string) {
        return this._instruction(ReturnInstruction, { value });
    }

    protected _decl(variable: string) {
        return this._instruction(DeclareInstruction, { targetVariable: variable });
    }

    protected _alloc(temporary: string) {
        return this._instruction(AllocateInstruction, { targetTemporary: temporary });
    }

    protected _free(identifier: string) {
        return this._instruction(FreeInstruction, { targetIdentifier: identifier });
    }

    protected _function(label: string) {
        return this._instruction(FunctionInstruction, { label });
    }

    public toString() {
        return this._blocks
            .map((b) => b.instructions.map((i) => i.toString()).join('\n'))
            .join('\n\n');
    }
}
