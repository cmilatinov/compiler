import { GrammarParser } from '../../src/lib/grammar';
import { ASTNode } from '../../src/lib/ast/ast-node';

export function expectAST(input: string, grammarParser: GrammarParser, expectedAST: ASTNode) {
    const ast = grammarParser.parseString(input);
    expect(ast).toBeDefined();
    expect(ast).toEqual(expectedAST);
}
