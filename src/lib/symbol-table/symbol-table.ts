import * as LibUtils from '../utils';
import { SymbolTableEntry } from './symbol-table-entry';

export class SymbolTable {
    private readonly _name: string;
    private readonly _parentTable?: SymbolTable;
    private readonly _table: SymbolTableEntry[];

    constructor(name: string = 'global', parentTable?: SymbolTable) {
        this._name = name;
        this._parentTable = parentTable;
        this._table = [];
    }

    public lookup(name: string, entryTypes?: string | string[]): SymbolTableEntry {
        return (
            this._table.find(SymbolTable.createFilterFunction(name, entryTypes)) ||
            this._parentTable?.lookup(name, entryTypes)
        );
    }

    public lookupMultiple(
        name: string,
        entryTypes?: string | string[],
        searchParent: boolean = false
    ): SymbolTableEntry[] {
        const filterFunc = SymbolTable.createFilterFunction(name, entryTypes);
        if (searchParent) {
            return this._table
                .filter(filterFunc)
                .concat(this._parentTable?.lookupMultiple(name, entryTypes, searchParent) || []);
        }
        return this._table.filter(filterFunc);
    }

    public insert(
        entry: SymbolTableEntry,
        entryTypes?: string | string[],
        force: boolean = false
    ): boolean {
        const existingEntry = this.lookup(entry.name, entryTypes);
        if (existingEntry && !force) return false;
        this._table.push(entry);
        return true;
    }

    public getParentEntry(): SymbolTableEntry {
        return this._parentTable?.lookupMultiple(this._name)?.find((e) => e.symbolTable === this);
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
        this._table.forEach((e) => {
            visitFn(e);
            if (e.symbolTable) {
                e.symbolTable.traverseEntries(visitFn);
            }
        });
    }

    public toString() {
        const tableObject = this._table.map((e) => {
            const entry = {
                Type: e.type,
                Name: e.name
            };
            if (e.symbolTable) entry['Symbol Table'] = `[Table: ${e.symbolTable.getName()}]`;
            entry['Reference Count'] = e.references;
            return entry;
        });
        const table = LibUtils.stringTable(tableObject);
        return `Table '${this._name}':\n${table}`;
    }

    private static createFilterFunction(name: string, entryTypes?: string | string[]) {
        return (e) =>
            e.name === name &&
            (!entryTypes ||
                (Array.isArray(entryTypes) && entryTypes.includes(e.type)) ||
                e.type === entryTypes);
    }
}
