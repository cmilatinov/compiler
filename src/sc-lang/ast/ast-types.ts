import { Expression } from './ast-expression-types';
import { ASTNode } from '../../lib/ast/ast-node';
import { BaseTypeSpecifier } from '../type/type-specifier';

export interface ExpressionStatement extends ASTNode {
    type: 'ExpressionStatement';
    expression: Expression;
}

export interface BlockStatement extends ASTNode {
    type: 'BlockStatement';
    statements: ASTNode[];
}

export interface WhileStatement extends ASTNode {
    type: 'WhileStatement';
    condition: Expression;
    body: ASTNode;
}

export interface DoWhileStatement extends ASTNode {
    type: 'DoWhileStatement';
    condition: Expression;
    body: ASTNode;
}

export interface ForStatement extends ASTNode {
    type: 'ForStatement';
    expressions: [Expression, Expression, Expression];
    body: ASTNode;
}

export interface IfStatement extends ASTNode {
    type: 'IfStatement';
    condition: Expression;
    ifBody: ASTNode;
    elseBody?: ASTNode;
}

export interface VariableStatement extends ASTNode {
    type: 'VariableStatement';
    declKeyword: 'const' | 'let';
    declList: VariableDeclaration[];
}

export interface VariableDeclaration extends ASTNode {
    type: 'VariableDeclaration';
    name: string;
    typeSpecifier?: BaseTypeSpecifier;
    variableInitializer?: VariableInitializer;
}

export interface VariableInitializer extends ASTNode {
    type: 'VariableInitializer';
    expression: Expression;
}

export interface FunctionDeclaration extends ASTNode {
    type: 'FunctionDeclaration';
    name: string;
    parameters: Parameter[];
    returnType: BaseTypeSpecifier;
    body: ASTNode[];
}

export interface Parameter extends ASTNode {
    type: 'Parameter';
    name: string;
    typeSpecifier: BaseTypeSpecifier;
}
