import { SourceLocation } from './tokenizer';

export abstract class BaseException extends Error {
    public readonly location: SourceLocation;

    protected constructor(message: string, location: SourceLocation) {
        super(message);
        this.location = location;
    }
}

export class SemanticException extends BaseException {
    public readonly name = 'SemanticException';

    constructor(message: string, location: SourceLocation) {
        super(message, location);
    }
}

export class SyntaxException extends BaseException {
    public readonly name = 'SyntaxException';

    constructor(message: string, location: SourceLocation) {
        super(message, location);
    }
}

export class TypeException extends BaseException {
    public readonly name = 'TypeException';

    constructor(message: string, location: SourceLocation) {
        super(message, location);
    }
}
