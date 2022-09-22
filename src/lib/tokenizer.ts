import * as fs from 'fs';

import { EOF } from './symbols';

export type TokenType = [RegExp, string, Function?];

export class SourceLocation {
    public readonly file: string;
    public readonly line: number;
    public readonly column: number;

    constructor(file: string, line: number, column: number) {
        this.file = file;
        this.line = line;
        this.column = column;
    }

    public toString(): string {
        return `(${this.file}:${this.line}:${this.column})`;
    }
}

export interface TokenInstance {
    type: string;
    value: string;
    location?: SourceLocation;
}

export const WhitespaceToken: TokenType = [/^\s+/, null];
export const SingleLineCommentToken: TokenType = [/^\/\/.*/, null];
export const MultiLineCommentToken: TokenType = [/^\/\*[\s\S]*?\*\//, null];

export const IntegerToken: TokenType = [/^(?:[1-9][0-9]*|0)/, 'int', Number];
export const FloatToken: TokenType = [
    /^[+\-]?(?:[1-9][0-9]*|0)?(?:\.[0-9]*[1-9]|\.0)(?:[eE][+\-]?(?:[1-9][0-9]*|0))?/,
    'float',
    Number
];
export const BooleanToken: TokenType = [/^(?:true|false)/, 'bool', Boolean];

const DEFAULT_TOKENS: TokenType[] = [
    // Whitespace
    WhitespaceToken,

    // Comments
    SingleLineCommentToken,
    MultiLineCommentToken,

    // Punctuators
    [/^\(/, '('],
    [/^\)/, ')'],
    [/^{/, '{'],
    [/^}/, '}'],
    [/^;/, ';'],
    [/^,/, ','],

    // Keywords
    [/^let/, 'let'],
    [/^const/, 'const'],
    [/^if/, 'if'],
    [/^else/, 'else'],
    [/^while/, 'while'],
    [/^for/, 'for'],
    [/^def/, 'def'],

    // Boolean
    [/^(true|false)/, 'BOOLEAN', Boolean],
    // Number
    [/^[0-9]+/, 'NUMBER', Number],
    // Identifier
    [/^[a-zA-Z_$][a-zA-Z0-9_$]*/, 'IDENTIFIER'],
    // String double-quoted
    [/^"[^"]*"/, 'STRING'],
    // String single-quoted
    [/^'[^']*'/, 'STRING'],

    // Operators
    [/^[+-]/, 'ADDITIVE_OPERATOR'],
    [/^[*/]/, 'MULTIPLICATIVE_OPERATOR'],
    [/^\^/, '^'],
    [/^=/, '=']
];

export class TokenizerFactory {
    static fromString(string: string, tokenTypes: TokenType[] = DEFAULT_TOKENS): Tokenizer {
        return new Tokenizer(string, tokenTypes);
    }

    static fromFile(file: string, tokenTypes: TokenType[] = DEFAULT_TOKENS): Tokenizer {
        const string = fs.readFileSync(file).toString();
        return new Tokenizer(string, tokenTypes, file);
    }
}

export class Tokenizer {
    private readonly _tokenTypes: TokenType[];
    private readonly _file: string;
    private readonly _string: string;

    private _cursor: number;

    public constructor(
        string: string,
        tokenTypes: TokenType[] = DEFAULT_TOKENS,
        file: string = 'inline'
    ) {
        this._tokenTypes = tokenTypes;
        this._file = file;
        this._string = string;
        this._cursor = 0;
    }

    public hasNext() {
        return this._cursor < this._string.length;
    }

    public next(): TokenInstance {
        const location = this.getCursorLocation();
        if (!this.hasNext()) {
            return {
                type: EOF,
                value: EOF,
                location
            };
        }

        const string = this._string.slice(this._cursor);
        let longestMatch = null;
        let tokenType: TokenType | null = null;
        for (let [regex, type, constructor] of this._tokenTypes) {
            const match = string.match(regex);
            if (!match) continue;

            if (!longestMatch || match[0].length > longestMatch[0].length) {
                longestMatch = match;
                tokenType = [regex, type, constructor];
            }
        }

        if (longestMatch) {
            this._cursor += longestMatch[0].length;
            let [regex, type, constructor] = tokenType;
            if (!type) return this.next();

            return {
                type,
                value: constructor ? constructor(longestMatch[0]) : longestMatch[0],
                location
            };
        }

        const unexpected = string.match(/^\S+/);
        this._cursor += unexpected[0].length;
        throw new SyntaxError(
            `${this.getCursorLocation().toString()} Unexpected token '${unexpected[0]}'!`
        );
    }

    public getCursorLocation(): SourceLocation {
        const str = this._string.substring(0, this._cursor);
        const lines = str.split(/\r?\n/);
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return new SourceLocation(this._file, line, column);
    }
}
