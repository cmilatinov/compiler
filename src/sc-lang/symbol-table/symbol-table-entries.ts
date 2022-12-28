import { BaseTypeSpecifier, FunctionTypeSpecifier } from '../type/type-specifier';
import { SymbolTable, SymbolTableEntry } from '../../lib/symbol-table';
import { Address } from '../../lib/code-generator/address';
import { InstructionBlock } from '../../lib/tac';

export enum SymbolTableEntryType {
    FUNCTION = 'function',
    PARAMETER = 'parameter',
    LOCAL_VARIABLE = 'local',
    CLASS_VARIABLE = 'data',
    CLASS = 'class',
    TEMPORARY = 'temporary'
}

export enum VariableType {
    INTEGER = 'int',
    FLOATING = 'float',
    CLASS = 'class'
}

export interface TemporaryEntry extends SymbolTableEntry {
    type: SymbolTableEntryType.TEMPORARY;
    typeSpecifier: BaseTypeSpecifier;
}

export interface FunctionEntry extends SymbolTableEntry {
    type: SymbolTableEntryType.FUNCTION;
    typeSpecifier: FunctionTypeSpecifier;
    symbolTable: SymbolTable;
    parameters: FunctionParameterEntry[];
    instructionBlock?: InstructionBlock;
    returnAddress?: Address;
}

export interface FunctionParameterEntry extends SymbolTableEntry {
    type: SymbolTableEntryType.PARAMETER;
    typeSpecifier: BaseTypeSpecifier;
    varType?: VariableType;
}

export interface LocalVariableEntry extends SymbolTableEntry {
    type: SymbolTableEntryType.LOCAL_VARIABLE;
    typeSpecifier: BaseTypeSpecifier;
    constant: boolean;
}
