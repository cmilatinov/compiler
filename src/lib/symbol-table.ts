import { ASTNode } from './ast/ast-node';

import * as LibUtils from '../lib/utils';
import { SourceLocation } from './tokenizer';

export interface SymbolTableEntry {
    type: 'class' | 'function' | 'data' | 'local' | 'parameter';
    name: string;
    parentTable: SymbolTable;
    location: SourceLocation;
    references: number;

    // Memory Allocation
    label?: string;
    offset?: number;
    size?: number;

    // Class / Function
    returnValueOffset?: number;
    symbolTable?: SymbolTable;

    // Class
    inheritanceList?: string[];
    baseClassOffsets?: number[];

    // Variable / Class member
    visibility?: 'private' | 'public';
    varType?: string;
    arraySizes?: number[];

    // Function
    implemented?: boolean;
    parameters?: ASTNode[],
    returnType?: string,
}

export class SymbolTable {

    private readonly _name: string;
    private readonly _parentTable?: SymbolTable;
    private readonly _table: SymbolTableEntry[];

    constructor(name: string = 'global', parentTable?: SymbolTable) {
        this._name = name;
        this._parentTable = parentTable;
        this._table = [];
    }

    public lookup(name: string): SymbolTableEntry {
        const result = this._table.find(e => e.name === name);
        if (result)
            return result;
        return this._parentTable?.lookup(name);
    }

    public lookupMultiple(name: string, searchParent: boolean = false) {
        if (searchParent)
            return this._table.filter(e => e.name === name).concat(this._parentTable?.lookupMultiple(name, searchParent) || []);
        return this._table.filter(e => e.name === name);
    }

    public insert(entry: SymbolTableEntry, force: boolean = false) {
        const existingEntry = this.lookup(entry.name);
        if (existingEntry && !force)
            return false;
        this._table.push(entry);
        return true;
    }

    public getParentEntry() {
        const parentEntries = this._parentTable?.lookupMultiple(this._name);
        return parentEntries?.find(e => e.symbolTable === this);
    }

    public getParentTable() {
        return this._parentTable;
    }

    public getName() {
        return this._name;
    }

    public getEntries() {
        return this._table;
    }

    public traverseEntries(visitFn: (entry: SymbolTableEntry) => void) {
        this._table.forEach(e => {
            visitFn(e);
            if (e.symbolTable) {
                e.symbolTable.traverseEntries(visitFn);
            }
        });
    }

    public toString() {
        const tableObject = this._table.map(e => {
            const entry = {
                'Type': e.type,
                'Name': e.name
            };
            if (e.visibility)
                entry['Visibility'] = e.visibility;
            if (e.varType)
                entry['Variable Type'] = e.varType;
            if (e.arraySizes)
                entry['Array Sizes'] = e.arraySizes.map(s => Number(s));
            if (e.inheritanceList)
                entry['Inheritance List'] = e.inheritanceList;
            if (e.label)
                entry['Label'] = e.label;
            if (e.size !== undefined)
                entry['Size'] = e.size;
            if (e.offset !== undefined)
                entry['Offset'] = e.offset;
            if (e.symbolTable)
                entry['Symbol Table'] = `[Table: ${e.symbolTable.getName()}]`;
            entry['Reference Count'] = e.references;
            return entry;
        })
        const table = LibUtils.stringTable(tableObject);
        return `Table '${this._name}':\n${table}`;
    }

}
