import { BaseTypeSpecifier, FunctionTypeSpecifier } from '../type/type-specifier';
import { SymbolTable, SymbolTableEntry } from '../../lib/symbol-table';
import { InstructionBlock } from '../../lib/tac';

export enum SymbolTableEntryType {
    FUNCTION = 'function',
    PARAMETER = 'parameter',
    LOCAL_VARIABLE = 'local',
    CLASS_VARIABLE = 'data',
    CLASS = 'class',
    TEMPORARY = 'temporary'
}

export enum VariableClass {
    INTEGER = 'int',
    FLOATING = 'float',
    MEMORY = 'memory'
}

export interface BaseSymbolTableEntry extends SymbolTableEntry {
    typeSpecifier: BaseTypeSpecifier;
}

export interface TemporaryEntry extends BaseSymbolTableEntry {
    type: SymbolTableEntryType.TEMPORARY;
}

export interface FunctionEntry extends BaseSymbolTableEntry {
    type: SymbolTableEntryType.FUNCTION;
    symbolTable: SymbolTable;
    parameters: FunctionParameterEntry[];
    instructionBlock?: InstructionBlock;
}

export interface FunctionParameterEntry extends BaseSymbolTableEntry {
    type: SymbolTableEntryType.PARAMETER;
}

export interface LocalVariableEntry extends BaseSymbolTableEntry {
    type: SymbolTableEntryType.LOCAL_VARIABLE;
    constant: boolean;
}
