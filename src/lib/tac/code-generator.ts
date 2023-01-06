import { Set } from 'immutable';
import {
    AssignmentInstruction,
    BaseInstructionTAC,
    ConditionalJumpInstruction,
    CopyInstruction,
    EndFunctionInstruction,
    FunctionInstruction,
    InstructionBlock,
    JumpInstruction,
    ParameterInstruction,
    ProcedureCallInstruction,
    ReturnInstruction,
    toStringLiveSets
} from './instruction';
import { DiagnosticProducer } from '../pipeline';
import { LabelGenerator } from '../code-generator';

export class CodeGeneratorTAC extends DiagnosticProducer {
    private readonly _lbGen: LabelGenerator = new LabelGenerator('B', 0);
    protected readonly _blocks: InstructionBlock[] = [];
    protected _currentBlock: InstructionBlock;

    protected _block(label?: string, standalone: boolean = false, setupControl: boolean = true) {
        const block: InstructionBlock = {
            label: label || this._lbGen.generateLabel(),
            instructions: [],
            control: { prev: [], next: [] },
            live: Set<string>()
        };
        if (!standalone && this._currentBlock) {
            this._currentBlock.next = block;
            if (setupControl) {
                this._currentBlock.control.next.push(block);
                block.control.prev.push(this._currentBlock);
            }
        }
        this._blocks.push(block);
        this._currentBlock = block;
        return block;
    }

    protected _instruction<T extends BaseInstructionTAC>(
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

    protected _function(label: string) {
        return this._instruction(FunctionInstruction, { label });
    }

    protected _endFunction(label: string) {
        return this._instruction(EndFunctionInstruction, { label });
    }

    protected _isLoopingBlock(block: InstructionBlock) {
        // TODO: Perform control graph search to see if we can end up executing this same block
        return block.control.next.includes(block);
    }

    public toString() {
        return this._blocks
            .map(
                (b) =>
                    `live = { ${b.live.join(', ')} }\n` +
                    `next = { ${b.control.next.map((b) => b.label).join(', ')} }\n` +
                    `${b.label} {\n${b.instructions
                        .map((i) => `    ${i.toString()}`.padEnd(30) + toStringLiveSets(i.live))
                        .join('\n')}\n}`
            )
            .join('\n\n');
    }
}
