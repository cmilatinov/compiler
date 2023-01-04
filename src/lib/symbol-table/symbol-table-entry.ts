import { SourceLocation } from '../tokenizer';
import { SymbolTable } from './symbol-table';

export interface SymbolTableEntry {
    type: string;
    location: SourceLocation;
    name: string;
    references: number;
    parentTable: SymbolTable;
    symbolTable?: SymbolTable;
}
