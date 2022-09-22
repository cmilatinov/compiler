import {
    ASTValidator,
    DEFAULT_ERROR_PROCESSOR,
    DEFAULT_WARNING_PROCESSOR
} from '../../lib/ast/ast-validator';
import { ASTNode } from '../../lib/ast/ast-node';
import { SymbolTable } from '../../lib/symbol-table/symbol-table';
import { SymbolTableEntry } from '../../lib/symbol-table/symbol-table-entry';
import { FunctionEntry, FunctionParameterEntry, LocalVariableEntry } from './symbol-table-entries';
import { BaseException, SemanticException } from '../../lib/exceptions';
import { VOID_TYPE } from '../type/types';
import * as TypeUtils from '../type/type-utils';
import { FunctionTypeSpecifier } from '../type/type-specifier';
import { StringProcessor } from '../../lib/string-processor';
import { FunctionDeclaration, VariableStatement } from '../ast/ast-types';

export class SymbolTableGenerator extends ASTValidator {
    private readonly _globalTable: SymbolTable;
    private _currentTable: SymbolTable;

    public constructor(
        warning: StringProcessor = DEFAULT_WARNING_PROCESSOR,
        error: StringProcessor = DEFAULT_ERROR_PROCESSOR
    ) {
        super(warning, error);
        this._currentTable = this._globalTable = new SymbolTable();
    }

    public getExports(): any {
        return {
            symbolTable: this._globalTable
        };
    }

    protected visit(node: ASTNode): boolean {
        try {
            super.visit(node);
            return true;
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
        if ((duplicate = shadowedMembers.find((m) => m.type === 'data'))) {
            this.warning(`Shadowed data member '${duplicate.name}'.`, entry.location);
        }

        if ((duplicate = shadowedMembers.find((m) => m.type === 'function'))) {
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
        if (!this._currentTable.insert(entry, ['local', 'parameter'])) {
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
                    TypeUtils.functionTypeEquals(
                        (e as FunctionEntry).typeSpecifier,
                        funcEntry.typeSpecifier
                    )
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
        const parameters: FunctionParameterEntry[] = (decl.parameters as ASTNode[]).map((p) => ({
            type: 'parameter',
            location: p.location,
            name: p.name,
            references: 0,
            parentTable: symbolTable,
            typeSpecifier: p.typeSpecifier
        }));
        const functionEntry: FunctionEntry = {
            type: 'function',
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
    }

    private _postVisitFunctionDeclaration(decl: FunctionDeclaration) {
        this._currentTable = this._currentTable.getParentTable() || this._globalTable;
        return true;
    }

    private _visitVariableStatement(node: VariableStatement) {
        for (const decl of node.declList) {
            const localVarEntry: LocalVariableEntry = {
                type: 'local',
                location: decl.location,
                name: decl.name,
                references: 0,
                parentTable: this._currentTable,
                typeSpecifier: decl.typeSpecifier,
                constant: node.declKeyword === 'const'
            };
            this._insertVariableEntry(localVarEntry);
        }
    }
}
