import { ASTNode } from '../../lib/ast/ast-node';
import { SourceLocation } from '../../lib/tokenizer';
import { Literal, Operator } from '../operator/operators';

export interface LiteralExpression extends ASTNode {
    type: Literal;
    location: SourceLocation;
    value: string;
}

export interface Expression extends ASTNode {
    type: 'Expression';
    location: SourceLocation;
    operator: Operator;
    operands: Expression[];
}

export interface IdentifierExpression extends ASTNode {
    type: 'Identifier';
    location: SourceLocation;
    value: string;
}
