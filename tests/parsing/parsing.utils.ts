import { Grammar, GrammarFactory, GrammarParser } from '../../src/lib/grammar';
import { ASTNode } from '../../src/lib/ast/ast-node';

type GrammarParserBuilder = {
    new (grammar: Grammar): GrammarParser;
};

export function expectAST(input: string, grammarParser: GrammarParser, expectedAST: ASTNode) {
    const derivation = grammarParser.parseString(input, (msg) => {
        throw msg;
    });
    expect(derivation).toBeDefined();
    const ast = grammarParser.createAST(derivation);
    expect(ast).toEqual(expectedAST);
}

export function createParsingTest(type: string, grammarParserBuilder: GrammarParserBuilder) {
    describe(`${type} calculator grammar`, () => {
        let grammar: Grammar;
        let grammarParser: GrammarParser;

        beforeAll(() => {
            grammar = GrammarFactory.fromFile('./grammars/simple1.grm');
            grammarParser = new grammarParserBuilder(grammar);
        });

        it('simple addition', () => {
            expectAST('24 + 63', grammarParser, {
                type: 'BinaryExpression',
                operator: '+',
                left: '24',
                right: '63'
            });
        });

        it('simple subtraction', () => {
            expectAST('13 - 56', grammarParser, {
                type: 'BinaryExpression',
                operator: '-',
                left: '13',
                right: '56'
            });
        });

        it('chained addition and subtraction', () => {
            expectAST('312 + 234 - 435 + 32', grammarParser, {
                type: 'BinaryExpression',
                operator: '+',
                left: {
                    type: 'BinaryExpression',
                    operator: '-',
                    left: {
                        type: 'BinaryExpression',
                        operator: '+',
                        left: '312',
                        right: '234'
                    },
                    right: '435'
                },
                right: '32'
            });
        });

        it('parenthesized chained addition and subtraction', () => {
            expectAST('13 + (527 + 341) - (128 + 85)', grammarParser, {
                type: 'BinaryExpression',
                operator: '-',
                left: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: '13',
                    right: {
                        type: 'BinaryExpression',
                        operator: '+',
                        left: '527',
                        right: '341'
                    }
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: '128',
                    right: '85'
                }
            });
        });

        it('simple multiplication', () => {
            expectAST('18 * 93', grammarParser, {
                type: 'BinaryExpression',
                operator: '*',
                left: '18',
                right: '93'
            });
        });

        it('simple division', () => {
            expectAST('16 / 58', grammarParser, {
                type: 'BinaryExpression',
                operator: '/',
                left: '16',
                right: '58'
            });
        });

        it('chained multiplication and division', () => {
            expectAST('73 / 32 / 953 * 19', grammarParser, {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'BinaryExpression',
                    operator: '/',
                    left: {
                        type: 'BinaryExpression',
                        operator: '/',
                        left: '73',
                        right: '32'
                    },
                    right: '953'
                },
                right: '19'
            });
        });

        it('parenthesized chained multiplication and division', () => {
            expectAST('13 / ((527 * 341) / 128) * 85', grammarParser, {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'BinaryExpression',
                    operator: '/',
                    left: '13',
                    right: {
                        type: 'BinaryExpression',
                        operator: '/',
                        left: {
                            type: 'BinaryExpression',
                            operator: '*',
                            left: '527',
                            right: '341'
                        },
                        right: '128'
                    }
                },
                right: '85'
            });
        });
    });
}
