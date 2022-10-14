import { ASTNode } from './ast-node';
import { DiagnosticProducer, PipelineStage } from '../pipeline';
import * as ASTUtils from './ast-utils';

export abstract class ASTValidator extends DiagnosticProducer implements PipelineStage {
    public abstract execute(input: any): any;

    protected validate(ast: ASTNode): boolean {
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
}
