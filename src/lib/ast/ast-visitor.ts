import { ASTNode } from './ast-node';

export interface ASTVisitor {
    getChildren(node: ASTNode): ASTNode[];
    visit(node: ASTNode);
    postVisit(node: ASTNode);
}
