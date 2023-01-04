import { ASTValidator } from '../../lib/ast/ast-validator';
import { ASTNode } from '../../lib/ast/ast-node';
import { SymbolTable, SymbolTableEntry } from '../../lib/symbol-table';
import {
    FunctionEntry,
    FunctionParameterEntry,
    LocalVariableEntry,
    SymbolTableEntryType
} from './symbol-table-entries';
import { BaseException, SemanticException } from '../../lib/exceptions';
import { BaseTypeSpecifier, FunctionTypeSpecifier, VOID_TYPE } from '../type/type-specifier';
import { FunctionDeclaration, VariableStatement } from '../ast/ast-types';

export class SymbolTableGenerator extends ASTValidator {
    private readonly _globalTable: SymbolTable;
    private _currentTable: SymbolTable;

    public constructor() {
        super();
        this._currentTable = this._globalTable = new SymbolTable();
    }

    public execute(input: ASTNode): any {
        try {
            if (!super.validate(input)) return false;
            return { ast: input, symbolTable: this._globalTable };
        } catch (err) {
            const exception = err as BaseException;
            this.error(exception.message, exception.location);
            return false;
        }
    }

    private _checkShadowedMembers(entry: SymbolTableEntry) {
        const shadowedMembers = this._currentTable.lookupMultiple(
            entry.name,
            ['data', 'function'],
            true
        );

        let duplicate: SymbolTableEntry | undefined;
        if (
            (duplicate = shadowedMembers.find(
                (m) => m.type === SymbolTableEntryType.CLASS_VARIABLE
            ))
        ) {
            this.warning(`Shadowed data member '${duplicate.name}'.`, entry.location);
        }

        if ((duplicate = shadowedMembers.find((m) => m.type === SymbolTableEntryType.FUNCTION))) {
            this.warning(
                `Shadowed function '${duplicate.name}: ` +
                    `${(duplicate as FunctionEntry).typeSpecifier.toString()}'.`,
                entry.location
            );
        }
    }

    private _insertParameterEntry(entry: FunctionParameterEntry) {
        this._checkShadowedMembers(entry);
        if (!this._currentTable.insert(entry, entry.type)) {
            throw new SemanticException(
                `Multiply declared function parameter '${entry.name}'.`,
                entry.location
            );
        }
    }

    private _insertVariableEntry(entry: LocalVariableEntry) {
        this._checkShadowedMembers(entry);
        if (
            !this._currentTable.insert(entry, [
                SymbolTableEntryType.LOCAL_VARIABLE,
                SymbolTableEntryType.PARAMETER
            ])
        ) {
            throw new SemanticException(
                `Multiply declared identifier '${entry.name}'.`,
                entry.location
            );
        }
    }

    private _insertFunctionEntry(funcEntry: FunctionEntry) {
        const existingEntries = this._currentTable.lookupMultiple(
            funcEntry.name,
            ['function', 'data'],
            false
        );

        if (
            existingEntries.find(
                (e) =>
                    e.type === 'function' &&
                    (e as FunctionEntry).typeSpecifier.equals(funcEntry.typeSpecifier)
            )
        ) {
            throw new SemanticException(
                `Multiply declared function '${funcEntry.name}: ` +
                    `${funcEntry.typeSpecifier.toString()}'.`,
                funcEntry.location
            );
        }

        if (existingEntries.find((e) => e.type === 'data')) {
            throw new SemanticException(
                `Multiply declared member '${funcEntry.name}'.`,
                funcEntry.location
            );
        }

        this._currentTable.insert(funcEntry, undefined, true);
        this._currentTable = funcEntry.symbolTable;

        for (const param of funcEntry.parameters) {
            this._insertParameterEntry(param);
        }
    }

    private _visitFunctionDeclaration(decl: FunctionDeclaration) {
        const symbolTable = new SymbolTable(decl.name, this._currentTable);
        const parameters: FunctionParameterEntry[] = (decl.parameters as ASTNode[]).map(
            (p, index) => ({
                type: SymbolTableEntryType.PARAMETER,
                location: p.location,
                name: p.name,
                references: 0,
                parentTable: symbolTable,
                typeSpecifier: p.typeSpecifier,
                index
            })
        );
        const functionEntry: FunctionEntry = {
            type: SymbolTableEntryType.FUNCTION,
            location: decl.location,
            name: decl.name,
            references: 0,
            parentTable: this._currentTable,
            symbolTable,
            parameters,
            typeSpecifier: new FunctionTypeSpecifier(
                decl.parameters.map((p) => p.typeSpecifier),
                decl.returnType || VOID_TYPE
            )
        };
        this._insertFunctionEntry(functionEntry);
        return true;
    }

    private _postVisitFunctionDeclaration(decl: FunctionDeclaration) {
        this._currentTable = this._currentTable.getParentTable() || this._globalTable;
        return true;
    }

    private _visitVariableStatement(node: VariableStatement) {
        for (const decl of node.declList) {
            const localVarEntry: LocalVariableEntry = {
                type: SymbolTableEntryType.LOCAL_VARIABLE,
                location: decl.location,
                name: decl.name,
                references: 0,
                parentTable: this._currentTable,
                typeSpecifier: decl.typeSpecifier,
                constant: node.declKeyword === 'const'
            };
            this._insertVariableEntry(localVarEntry);
        }
        return true;
    }
}
