import { ASTNode } from './ast-node';
import { StringProcessor } from '../string-processor';

export const DEFAULT_WARNING_PROCESSOR: StringProcessor = str => console.log(`[WARNING]: ${str}`);
export const DEFAULT_ERROR_PROCESSOR: StringProcessor = str => console.log(`[ERROR]: ${str}`);

export abstract class ASTValidator {

    protected readonly _warning: StringProcessor;
    protected readonly _error: StringProcessor;

    protected constructor(warning: StringProcessor = DEFAULT_WARNING_PROCESSOR,
                          error: StringProcessor = DEFAULT_ERROR_PROCESSOR) {
        this._warning = warning;
        this._error = error;
    }

    public validate(ast: ASTNode): boolean {
        let valid = this.visit(ast);
        if (!valid)
            return false;
        const childrenValid = this.getChildren(ast).map(c => this.validate(c));
        valid = this.postVisit(ast);
        return valid && childrenValid.every(v => v);
    }

    protected abstract visit(node: ASTNode): boolean;

    protected abstract postVisit(node: ASTNode): boolean;

    protected abstract getChildren(node: ASTNode): ASTNode[];

}

