import { DiagnosticCallback } from './diagnostic';

export interface PipelineStage {
    execute(input: any): any;
    set diagnosticCallback(value: DiagnosticCallback);
}

export class ParsingPipeline {
    private readonly _stages: PipelineStage[];

    constructor(...stages: PipelineStage[]) {
        this._stages = stages;
    }

    execute(input: any) {
        let next = input;
        this._stages.every((s) => {
            next = s.execute(next);
            return !!next;
        });
        return next;
    }

    set diagnosticCallback(value: DiagnosticCallback) {
        this._stages.forEach((s) => (s.diagnosticCallback = value));
    }
}
