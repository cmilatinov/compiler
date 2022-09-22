import colors from 'colors';

import { ASTNode } from './ast-node';
import { StringProcessor } from '../string-processor';
import { SourceLocation } from '../tokenizer';
import * as ASTUtils from './ast-utils';

export const DEFAULT_WARNING_PROCESSOR: StringProcessor = (str) =>
    console.log(`${colors.bold('[WARNING]')} ${str}`.yellow);
export const DEFAULT_ERROR_PROCESSOR: StringProcessor = (str) =>
    console.log(`${colors.bold('[ERROR]')} ${str}`.red);

export abstract class ASTValidator {
    protected readonly _warning: StringProcessor;
    protected readonly _error: StringProcessor;

    protected constructor(
        warning: StringProcessor = DEFAULT_WARNING_PROCESSOR,
        error: StringProcessor = DEFAULT_ERROR_PROCESSOR
    ) {
        this._warning = warning;
        this._error = error;
    }

    public abstract getExports(): any;

    public validate(ast: ASTNode): boolean {
        let valid = this.visit(ast);
        if (!valid) {
            this.postVisit(ast);
            return false;
        }
        const childrenValid = this.getChildren(ast).map((c) => this.validate(c));
        valid = this.postVisit(ast);
        return valid && childrenValid.every((v) => v);
    }

    protected visit(node: ASTNode): boolean {
        if (typeof this[`_visit${node.type}`] === 'function') {
            return this[`_visit${node.type}`](node);
        }
        return true;
    }

    protected postVisit(node: ASTNode): boolean {
        if (typeof this[`_postVisit${node.type}`] === 'function') {
            return this[`_postVisit${node.type}`](node);
        }
        return true;
    }

    protected getChildren(node: ASTNode): ASTNode[] {
        return ASTUtils.getNodeChildren(node);
    }

    protected error(str: string, location?: SourceLocation) {
        this._error(`${location ? `${location.toString().underline} ` : ''}${str}`);
    }

    protected warning(str: string, location?: SourceLocation) {
        this._warning(`${location ? `${location.toString().underline} ` : ''}${str}`);
    }
}
