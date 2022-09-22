import { SymbolTableEntry } from '../../lib/symbol-table';

export function isReferenceType(varEntry: SymbolTableEntry) {
    if (
        varEntry.arraySizes.length === 0 &&
        (varEntry.varType === 'integer' || varEntry.varType === 'float')
    )
        return false;
    return varEntry.type === 'parameter';
}
