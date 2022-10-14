import { SourceLocation } from '../tokenizer';
import { SymbolTable } from './symbol-table';
import { Address } from '../code-generator/address';

export interface SymbolTableEntry {
    type: string;
    location: SourceLocation;
    name: string;
    references: number;
    parentTable: SymbolTable;
    symbolTable?: SymbolTable;
    address?: Address;
}
