import { Grammar, GrammarFactory } from '../../src/lib/grammar';
import { GrammarParserLR, GrammarParserSLR1 } from '../../src/lib/grammar/parsers';
import { expectAST } from './ast.utils';
import { SourceLocation } from '../../src/lib/tokenizer';
import '../../src/sc-lang/type/type-specifier';
import { INTEGER_TYPE, VOID_TYPE } from '../../src/sc-lang/type/type-specifier';
import { LRParseTable } from '../../src/lib/grammar/parsers/lr-parse-table';
import * as fs from 'fs';

describe('language parser', () => {
    let grammar: Grammar;
    let grammarParser: GrammarParserLR<any>;

    beforeAll(() => {
        grammar = GrammarFactory.fromGRMFile('./grammars/sc-lang.grm');
        if (fs.existsSync('./tables/sc-lang.json')) {
            grammarParser = new GrammarParserSLR1(
                grammar,
                LRParseTable.load('./tables/sc-lang.json')
            );
        } else {
            grammarParser = new GrammarParserSLR1(grammar);
            grammarParser.parseTable.save('./tables/sc-lang.json');
        }
    });

    it('simple empty main function', () => {
        expectAST('def main () { }', grammarParser, {
            type: 'Program',
            sourceElements: [
                {
                    type: 'FunctionDeclaration',
                    location: new SourceLocation('inline', 1, 5),
                    name: 'main',
                    parameters: [],
                    returnType: VOID_TYPE,
                    vararg: false,
                    body: []
                }
            ]
        });
    });

    it('variable declaration', () => {
        expectAST('def main() { let i: int = 0; }', grammarParser, {
            type: 'Program',
            sourceElements: [
                {
                    type: 'FunctionDeclaration',
                    location: new SourceLocation('inline', 1, 5),
                    name: 'main',
                    parameters: [],
                    returnType: VOID_TYPE,
                    vararg: false,
                    body: [
                        {
                            type: 'VariableStatement',
                            location: new SourceLocation('inline', 1, 14),
                            declKeyword: 'let',
                            declList: [
                                {
                                    type: 'VariableDeclaration',
                                    location: new SourceLocation('inline', 1, 18),
                                    name: 'i',
                                    typeSpecifier: {
                                        ...INTEGER_TYPE,
                                        location: new SourceLocation('inline', 1, 21)
                                    },
                                    variableInitializer: {
                                        type: 'VariableInitializer',
                                        location: new SourceLocation('inline', 1, 25),
                                        expression: {
                                            type: 'IntLiteral',
                                            location: new SourceLocation('inline', 1, 27),
                                            value: '0'
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    });

    it('if statement', () => {
        expectAST(
            'def main() { if (1 < 3) someFunction(); else someOtherFunction(); }',
            grammarParser,
            {
                type: 'Program',
                sourceElements: [
                    {
                        type: 'FunctionDeclaration',
                        location: new SourceLocation('inline', 1, 1),
                        name: 'main',
                        parameters: [],
                        returnType: VOID_TYPE,
                        body: [
                            {
                                type: 'IfStatement',
                                location: new SourceLocation('inline', 1, 14),
                                condition: {
                                    type: 'Expression',
                                    location: new SourceLocation('inline', 1, 18),
                                    operator: '<',
                                    operands: [
                                        {
                                            type: 'IntLiteral',
                                            location: new SourceLocation('inline', 1, 18),
                                            value: '1'
                                        },
                                        {
                                            type: 'IntLiteral',
                                            location: new SourceLocation('inline', 1, 22),
                                            value: '3'
                                        }
                                    ]
                                },
                                ifBody: {
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'Expression',
                                        location: new SourceLocation('inline', 1, 25),
                                        operator: '()',
                                        operands: [
                                            {
                                                type: 'Identifier',
                                                location: new SourceLocation('inline', 1, 25),
                                                value: 'someFunction'
                                            }
                                        ]
                                    }
                                },
                                elseBody: {
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'Expression',
                                        location: new SourceLocation('inline', 1, 46),
                                        operator: '()',
                                        operands: [
                                            {
                                                type: 'Identifier',
                                                location: new SourceLocation('inline', 1, 46),
                                                value: 'someOtherFunction'
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        );
    });

    it('while loop', () => {
        expectAST('def main() { while (84 > 21) { one(); two(); } }', grammarParser, {
            type: 'Program',
            sourceElements: [
                {
                    type: 'FunctionDeclaration',
                    location: new SourceLocation('inline', 1, 1),
                    name: 'main',
                    parameters: [],
                    returnType: VOID_TYPE,
                    body: [
                        {
                            type: 'WhileStatement',
                            location: new SourceLocation('inline', 1, 14),
                            condition: {
                                type: 'Expression',
                                location: new SourceLocation('inline', 1, 21),
                                operator: '>',
                                operands: [
                                    {
                                        type: 'IntLiteral',
                                        location: new SourceLocation('inline', 1, 21),
                                        value: '84'
                                    },
                                    {
                                        type: 'IntLiteral',
                                        location: new SourceLocation('inline', 1, 26),
                                        value: '21'
                                    }
                                ]
                            },
                            body: {
                                type: 'BlockStatement',
                                location: new SourceLocation('inline', 1, 30),
                                statements: [
                                    {
                                        type: 'ExpressionStatement',
                                        expression: {
                                            type: 'Expression',
                                            location: new SourceLocation('inline', 1, 32),
                                            operator: '()',
                                            operands: [
                                                {
                                                    type: 'Identifier',
                                                    location: new SourceLocation('inline', 1, 32),
                                                    value: 'one'
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        type: 'ExpressionStatement',
                                        expression: {
                                            type: 'Expression',
                                            location: new SourceLocation('inline', 1, 39),
                                            operator: '()',
                                            operands: [
                                                {
                                                    type: 'Identifier',
                                                    location: new SourceLocation('inline', 1, 39),
                                                    value: 'two'
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });
    });

    // it('for loop');
});
