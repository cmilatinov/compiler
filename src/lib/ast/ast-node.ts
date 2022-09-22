import { SourceLocation } from '../tokenizer';

export interface ASTNode {
    type: string;
    location?: SourceLocation;

    [key: string]: any;
}
