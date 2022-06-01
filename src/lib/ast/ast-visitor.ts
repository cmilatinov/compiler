import { ASTNode } from './ast-node';

export abstract class ASTVisitorBase {

    public traverse(node: ASTNode) {
        this.visit(node);
        const children = this.getChildren(node);
        children.forEach(c => this.traverse(c));
        this.postVisit(node);
    }

    protected abstract getChildren(node: ASTNode): ASTNode[];

    protected abstract visit(node: ASTNode);

    protected abstract postVisit(node: ASTNode);

}

