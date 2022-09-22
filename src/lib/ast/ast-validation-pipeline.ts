import { ASTValidator, DEFAULT_ERROR_PROCESSOR, DEFAULT_WARNING_PROCESSOR } from './ast-validator';
import { ASTNode } from './ast-node';
import { StringProcessor } from '../string-processor';

type ASTValidatorBuilder = {
    new (warning: StringProcessor, error: StringProcessor, imports: any): ASTValidator;
};

export class ASTValidationPipeline {
    private readonly _validators: ASTValidatorBuilder[];
    private _warning: StringProcessor;
    private _error: StringProcessor;

    constructor(...validators: ASTValidatorBuilder[]) {
        this._validators = validators;
        this._warning = DEFAULT_WARNING_PROCESSOR;
        this._error = DEFAULT_ERROR_PROCESSOR;
    }

    public validate(ast: ASTNode) {
        let imports = {};
        return this._validators.every((v) => {
            const instance = new v(this._warning, this._error, imports);
            const valid = instance.validate(ast);
            imports = instance.getExports();
            return valid;
        });
    }

    public set warningProcessor(warning: StringProcessor) {
        this._warning = warning;
    }

    public set errorProcessor(error: StringProcessor) {
        this._error = error;
    }
}
