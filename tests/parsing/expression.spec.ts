import { Grammar, GrammarFactory } from '../../src/lib/grammar';
import { GrammarParserLR, GrammarParserSLR1 } from '../../src/lib/grammar/parsers';
import { expectAST } from './ast.utils';
import { SourceLocation } from '../../src/lib/tokenizer';
import fs from 'fs';
import { LRParseTable } from '../../src/lib/grammar/parsers/lr-parse-table';

describe('expression grammar', () => {
    let grammar: Grammar;
    let grammarParser: GrammarParserLR<any>;

    beforeAll(() => {
        grammar = GrammarFactory.fromGRMFile('./grammars/expression.grm');
        if (fs.existsSync('./tables/expression.json')) {
            grammarParser = new GrammarParserSLR1(
                grammar,
                LRParseTable.load('./tables/expression.json')
            );
        } else {
            grammarParser = new GrammarParserSLR1(grammar);
            grammarParser.parseTable.save('./tables/expression.json');
        }
    });

    it('assignment', () => {
        expectAST('a = 0', grammarParser, {
            type: 'Expression',
            location: new SourceLocation('inline', 1, 1),
            operator: '=',
            operands: [
                {
                    type: 'Identifier',
                    location: new SourceLocation('inline', 1, 1),
                    value: 'a'
                },
                {
                    type: 'IntLiteral',
                    location: new SourceLocation('inline', 1, 5),
                    value: '0'
                }
            ]
        });
    });
});
