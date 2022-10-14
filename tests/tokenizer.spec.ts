import { Grammar, GrammarFactory } from '../src/lib/grammar';
import { SourceLocation, TokenInstance, Tokenizer } from '../src/lib/tokenizer';

function expectTokens(input: string, grammar: Grammar, tokens: TokenInstance[]) {
    const tokenizer = new Tokenizer(input, grammar.getTokenTypes());
    const actualTokens: TokenInstance[] = [];
    while (tokenizer.hasNext()) {
        actualTokens.push(tokenizer.next());
    }
    expect(actualTokens).toMatchObject(
        expect.arrayContaining(
            tokens.map((t) =>
                expect.objectContaining({ ...t, location: expect.objectContaining(t.location) })
            )
        )
    );
}

function expectError(input: string, grammar: Grammar, errMsg: string) {
    const tokenizer = new Tokenizer(input, grammar.getTokenTypes());
    while (tokenizer.hasNext()) {
        try {
            tokenizer.next();
        } catch (err) {
            expect(err.message).toContain(errMsg);
            return;
        }
    }
    throw 'Expected error';
}

describe('calculator grammar', () => {
    let grammar: Grammar;

    beforeAll(() => {
        grammar = GrammarFactory.fromGRMFile('./grammars/simple1.grm');
    });

    it('unexpected tokens', () => {
        expectError('32 + % 23', grammar, `Unexpected token '%'`);
        expectError('-- 2 # + 2', grammar, `Unexpected token '#'`);
        expectError('2 - 2 + &', grammar, `Unexpected token '&'`);
    });

    it('numbers', () => {
        expectTokens('28 93 02 12 30', grammar, [
            {
                type: `'number'`,
                value: '28',
                location: new SourceLocation('inline', 1, 1)
            },
            {
                type: `'number'`,
                value: '93',
                location: new SourceLocation('inline', 1, 4)
            },
            {
                type: `'number'`,
                value: '0',
                location: new SourceLocation('inline', 1, 7)
            },
            {
                type: `'number'`,
                value: '2',
                location: new SourceLocation('inline', 1, 8)
            },
            {
                type: `'number'`,
                value: '12',
                location: new SourceLocation('inline', 1, 10)
            },
            {
                type: `'number'`,
                value: '30',
                location: new SourceLocation('inline', 1, 13)
            }
        ]);
    });

    it('operations', () => {
        expectTokens('+ - * /', grammar, [
            {
                type: `'add_op'`,
                value: '+',
                location: new SourceLocation('inline', 1, 1)
            },
            {
                type: `'add_op'`,
                value: '-',
                location: new SourceLocation('inline', 1, 3)
            },
            {
                type: `'mul_op'`,
                value: '*',
                location: new SourceLocation('inline', 1, 5)
            },
            {
                type: `'mul_op'`,
                value: '/',
                location: new SourceLocation('inline', 1, 7)
            }
        ]);
    });

    it('parentheses', () => {
        expectTokens('( )()', grammar, [
            {
                type: `'('`,
                value: '(',
                location: new SourceLocation('inline', 1, 1)
            },
            {
                type: `')'`,
                value: ')',
                location: new SourceLocation('inline', 1, 3)
            },
            {
                type: `'('`,
                value: '(',
                location: new SourceLocation('inline', 1, 4)
            },
            {
                type: `')'`,
                value: ')',
                location: new SourceLocation('inline', 1, 5)
            }
        ]);
    });

    it('numbers, operations, and parentheses', () => {
        expectTokens('3 * 2 + (4 - 1)', grammar, [
            {
                type: `'number'`,
                value: '3',
                location: new SourceLocation('inline', 1, 1)
            },
            {
                type: `'mul_op'`,
                value: '*',
                location: new SourceLocation('inline', 1, 3)
            },
            {
                type: `'number'`,
                value: '2',
                location: new SourceLocation('inline', 1, 5)
            },
            {
                type: `'add_op'`,
                value: '+',
                location: new SourceLocation('inline', 1, 7)
            },
            {
                type: `'('`,
                value: '(',
                location: new SourceLocation('inline', 1, 9)
            },
            {
                type: `'number'`,
                value: '4',
                location: new SourceLocation('inline', 1, 10)
            },
            {
                type: `'add_op'`,
                value: '-',
                location: new SourceLocation('inline', 1, 12)
            },
            {
                type: `'number'`,
                value: '1',
                location: new SourceLocation('inline', 1, 14)
            },
            {
                type: `')'`,
                value: ')',
                location: new SourceLocation('inline', 1, 15)
            }
        ]);
        expectTokens('8 / 2 * (2 + 2)', grammar, [
            {
                type: `'number'`,
                value: '8',
                location: new SourceLocation('inline', 1, 1)
            },
            {
                type: `'mul_op'`,
                value: '/',
                location: new SourceLocation('inline', 1, 3)
            },
            {
                type: `'number'`,
                value: '2',
                location: new SourceLocation('inline', 1, 5)
            },
            {
                type: `'mul_op'`,
                value: '*',
                location: new SourceLocation('inline', 1, 7)
            },
            {
                type: `'('`,
                value: '(',
                location: new SourceLocation('inline', 1, 9)
            },
            {
                type: `'number'`,
                value: '2',
                location: new SourceLocation('inline', 1, 10)
            },
            {
                type: `'add_op'`,
                value: '+',
                location: new SourceLocation('inline', 1, 12)
            },
            {
                type: `'number'`,
                value: '2',
                location: new SourceLocation('inline', 1, 14)
            },
            {
                type: `')'`,
                value: ')',
                location: new SourceLocation('inline', 1, 15)
            }
        ]);
        expectTokens('(5 + 3) * 2', grammar, [
            {
                type: `'('`,
                value: '(',
                location: new SourceLocation('inline', 1, 1)
            },
            {
                type: `'number'`,
                value: '5',
                location: new SourceLocation('inline', 1, 2)
            },
            {
                type: `'add_op'`,
                value: '+',
                location: new SourceLocation('inline', 1, 4)
            },
            {
                type: `'number'`,
                value: '3',
                location: new SourceLocation('inline', 1, 6)
            },
            {
                type: `')'`,
                value: ')',
                location: new SourceLocation('inline', 1, 7)
            },
            {
                type: `'mul_op'`,
                value: '*',
                location: new SourceLocation('inline', 1, 9)
            },
            {
                type: `'number'`,
                value: '2',
                location: new SourceLocation('inline', 1, 11)
            }
        ]);
    });
});
