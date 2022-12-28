import { Operator } from '../../../operator/operators';
import { InstructionX64 } from '../instruction';
import { BaseInstructionTAC } from '../../../../lib/tac';
import { CodeGeneratorSCLangX64New } from '../code-generator-new';

type OperatorImpl = InstructionX64 | ((instruction: BaseInstructionTAC) => void) | undefined;
type OperatorImplMap = {
    [key in Operator]: OperatorImpl[];
};

function defaultImpl(this: CodeGeneratorSCLangX64New, operator: Operator, arity: number) {}

export class OperatorMap {
    private _map: OperatorImplMap;

    public add(operator: Operator, arity: number, impl: OperatorImpl) {
        this._map[operator][arity - 1] = impl;
    }

    public impl(operator: Operator, arity: number, codeGenerator: CodeGeneratorSCLangX64New) {
        const impl = this._map[operator][arity - 1];
        if (impl) {
            if (typeof impl === 'string') defaultImpl.call(codeGenerator);
        }
    }
}
