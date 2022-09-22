import { BaseTypeSpecifier, FunctionTypeSpecifier } from '../type/type-specifier';
import { SymbolTable } from '../../lib/symbol-table/symbol-table';
import { SymbolTableEntry } from '../../lib/symbol-table/symbol-table-entry';

export interface FunctionEntry extends SymbolTableEntry {
    type: 'function';
    typeSpecifier: FunctionTypeSpecifier;
    symbolTable: SymbolTable;
    parameters: FunctionParameterEntry[];
}

export interface FunctionParameterEntry extends SymbolTableEntry {
    type: 'parameter';
    typeSpecifier: BaseTypeSpecifier;
}

export interface LocalVariableEntry extends SymbolTableEntry {
    type: 'local';
    typeSpecifier: BaseTypeSpecifier;
    constant: boolean;
}
