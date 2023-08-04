import { ASTNode } from '../../lib/ast/ast-node';
import { BaseTypeSpecifier } from '../type/type-specifier';
import { Operator } from '../operator/operators';
import { SourceLocation } from '../../lib/tokenizer';

export enum NodeType {
    PROGRAM = 'Program',
    EXPRESSION_STATEMENT = 'ExpressionStatement',
    EXPRESSION = 'Expression',
    BLOCK_STATEMENT = 'BlockStatement',
    WHILE_STATEMENT = 'WhileStatement',
    DO_WHILE_STATEMENT = 'DoWhileStatement',
    FOR_STATEMENT = 'ForStatement',
    IF_STATEMENT = 'IfStatement',
    RETURN_STATEMENT = 'ReturnStatement',
    EMPTY_STATEMENT = 'EmptyStatement',
    VARIABLE_STATEMENT = 'VariableStatement',
    VARIABLE_DECLARATION = 'VariableDeclaration',
    VARIABLE_INITIALIZER = 'VariableInitializer',
    EXTERN_VARIABLE_DECLARATION = 'ExternVariableDeclaration',
    EXTERN_FUNCTION_DECLARATION = 'ExternFunctionDeclaration',
    FUNCTION_DECLARATION = 'FunctionDeclaration',
    PARAMETER = 'Parameter',
    IDENTIFIER = 'Identifier'
}

export enum LiteralType {
    STRING = 'StringLiteral',
    FLOAT = 'FloatLiteral',
    INTEGER = 'IntLiteral',
    BOOLEAN = 'BooleanLiteral',
    NULL = 'NullLiteral',
    THIS = 'ThisLiteral'
}

export enum VariableDeclarationKeyword {
    LET = 'let',
    CONST = 'const'
}

export interface Program extends ASTNode {
    type: NodeType.PROGRAM;
    sourceElements: ASTNode[];
}

export interface ExpressionStatement extends ASTNode {
    type: NodeType.EXPRESSION_STATEMENT;
    expression: Expression;
}

export interface Expression extends ASTNode {
    type: NodeType.EXPRESSION | NodeType.IDENTIFIER | LiteralType;
    typeSpecifier?: BaseTypeSpecifier;
}

export interface OperatorExpression extends Expression {
    type: NodeType.EXPRESSION;
    location: SourceLocation;
    operator: Operator;
    operands: Expression[];
}

export interface IdentifierExpression extends ASTNode {
    type: NodeType.IDENTIFIER;
    location: SourceLocation;
    value: string;
}

export interface LiteralExpression extends ASTNode {
    type: LiteralType;
    location: SourceLocation;
    value: string;
}

export interface BlockStatement extends ASTNode {
    type: NodeType.BLOCK_STATEMENT;
    statements: ASTNode[];
}

export interface WhileStatement extends ASTNode {
    type: NodeType.WHILE_STATEMENT;
    condition: Expression;
    body: ASTNode;
}

export interface DoWhileStatement extends ASTNode {
    type: NodeType.DO_WHILE_STATEMENT;
    condition: Expression;
    body: ASTNode;
}

export interface ForStatement extends ASTNode {
    type: NodeType.FOR_STATEMENT;
    expressions: [Expression, Expression, Expression];
    body: ASTNode;
}

export interface IfStatement extends ASTNode {
    type: NodeType.IF_STATEMENT;
    condition: Expression;
    ifBody: ASTNode;
    elseBody?: ASTNode;
}

export interface ReturnStatement extends ASTNode {
    type: NodeType.RETURN_STATEMENT;
    expression?: Expression;
}

export interface VariableStatement extends ASTNode {
    type: NodeType.VARIABLE_STATEMENT;
    declKeyword: VariableDeclarationKeyword;
    declList: VariableDeclaration[];
}

export interface VariableDeclaration extends ASTNode {
    type: NodeType.VARIABLE_DECLARATION;
    name: string;
    typeSpecifier?: BaseTypeSpecifier;
    variableInitializer?: VariableInitializer;
}

export interface VariableInitializer extends ASTNode {
    type: NodeType.VARIABLE_INITIALIZER;
    expression: Expression;
}

export interface ExternVariableDeclaration extends ASTNode {
    type: NodeType.EXTERN_VARIABLE_DECLARATION;
    name: string;
    typeSpecifier: BaseTypeSpecifier;
}

export interface ExternFunctionDeclaration extends ASTNode {
    type: NodeType.EXTERN_FUNCTION_DECLARATION;
    name: string;
    returnType: BaseTypeSpecifier;
    parameters: Parameter[];
    vararg: boolean;
}

export interface FunctionDeclaration extends ASTNode {
    type: NodeType.FUNCTION_DECLARATION;
    name: string;
    parameters: Parameter[];
    returnType: BaseTypeSpecifier;
    body: ASTNode[];
    vararg: boolean;
}

export interface Parameter extends ASTNode {
    type: NodeType.PARAMETER;
    name: string;
    typeSpecifier: BaseTypeSpecifier;
}
