import { OrderedSet } from 'immutable';
import _ from 'lodash';
import * as fs from 'fs';
import colors from 'colors';

import * as Utils from '../../utils';
import { Grammar } from '../grammar';
import { EOF } from '../../symbols';

export enum ParseTableActionType {
    SHIFT,
    REDUCE,
    GOTO,
    ACCEPT,
    REJECT
}

export class ParseTableAction {
    public readonly type: ParseTableActionType;
    public readonly value?: number;

    constructor(type: ParseTableActionType, value?: number) {
        this.type = type;
        this.value = value;
    }

    public toString(): string {
        switch (this.type) {
            case ParseTableActionType.ACCEPT:
                return 'acc';
            case ParseTableActionType.REDUCE:
                return `r${this.value}`;
            case ParseTableActionType.GOTO:
                return `${this.value}`;
            case ParseTableActionType.SHIFT:
                return `s${this.value}`;
        }
    }

    public static fromObject(obj: any) {
        return new ParseTableAction(obj?.type, obj?.value);
    }
}

export class LRParseTable {
    private readonly _table: { [key: string]: ParseTableAction | ParseTableAction[] }[];

    public constructor(table?: any) {
        if (table) this._table = table;
        else this._table = [];
    }

    public getAction(stateIndex: number, symbol: string): ParseTableAction {
        if (stateIndex >= 0 && stateIndex < this._table.length) {
            if (Array.isArray(this._table[stateIndex][symbol])) {
                const arr = [...(this._table[stateIndex][symbol] as ParseTableAction[])];
                arr.sort((a, b) => a.type - b.type);
                return arr[0] || new ParseTableAction(ParseTableActionType.REJECT);
            }
            return (
                (this._table[stateIndex][symbol] as ParseTableAction) ||
                new ParseTableAction(ParseTableActionType.REJECT)
            );
        }
        return new ParseTableAction(ParseTableActionType.REJECT);
    }

    public addEntry(stateIndex: number, symbol: string, action: ParseTableAction) {
        if (this._table[stateIndex] && this._table[stateIndex][symbol]) {
            if (Array.isArray(this._table[stateIndex][symbol]))
                (this._table[stateIndex][symbol] as ParseTableAction[]).push(action);
            else
                this._table[stateIndex][symbol] = [
                    this._table[stateIndex][symbol] as ParseTableAction,
                    action
                ];
        } else if (this._table[stateIndex]) {
            this._table[stateIndex][symbol] = action;
        } else {
            this._table[stateIndex] = { [symbol]: action };
        }
    }

    public toString(): string {
        // Collect all symbols and sort them to have terminals first
        let symbols: string[] = this._table
            .reduce((acc, value) => {
                Object.keys(value).forEach((k) => (acc = acc.add(k)));
                return acc;
            }, OrderedSet<string>())
            .toJSON();
        symbols.sort((a, b) => Number(Grammar.isTerminal(b)) - Number(Grammar.isTerminal(a)));

        // Terminal and non-terminal counts
        const terminalCount = symbols.findIndex((s) => !Grammar.isTerminal(s));
        const nonTerminalCount = symbols.length - terminalCount;

        // Sort symbols in alphabetical order
        const compareTerminals = (a, b) => (a === EOF ? 1 : b === EOF ? -1 : a.localeCompare(b));
        symbols = [
            ..._.slice(symbols, 0, terminalCount).sort(compareTerminals),
            ..._.slice(symbols, terminalCount)
        ];

        // Create table double array
        const tableObject = this._table
            .map((e) =>
                symbols.map((s) =>
                    Array.isArray(e[s])
                        ? (e[s] as ParseTableAction[]).map((a) => a.toString()).join('/').red
                        : e[s]?.toString() === 'acc'
                        ? 'acc'.green
                        : e[s]?.toString() || ''
                )
            )
            .map((e, i) => [`${i}`.cyan, ...e]);

        // Add symbols row
        tableObject.unshift([colors.bold('State'.yellow), ...symbols.map((s) => s.cyan)]);

        // Add second row
        tableObject.unshift([
            colors.bold('\\'.yellow),
            colors.bold('Action'.yellow),
            ...[...Array(terminalCount - 1)].map(() => ''),
            colors.bold('Goto'.yellow),
            ...[...Array(nonTerminalCount - 1)].map(() => '')
        ]);

        // Return table
        return Utils.stringTableFormatted(tableObject, {
            columnDefault: { alignment: 'center', width: 7 },
            spanningCells: [
                { col: 1, row: 0, colSpan: terminalCount, alignment: 'center' },
                { col: terminalCount + 1, row: 0, colSpan: nonTerminalCount, alignment: 'center' }
            ]
        });
    }

    public save(file: string) {
        fs.writeFileSync(file, JSON.stringify(this._table));
    }

    public static load(file: string): LRParseTable {
        const table = JSON.parse(fs.readFileSync(file).toString());
        table.forEach((state) => {
            Object.entries(state).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    state[key] = value.map((v) => ParseTableAction.fromObject(v));
                } else if (typeof value === 'object') {
                    state[key] = ParseTableAction.fromObject(value);
                }
            });
        });
        return new LRParseTable(table);
    }
}
