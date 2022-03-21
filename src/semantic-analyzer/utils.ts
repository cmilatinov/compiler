import * as _ from 'lodash';

import { ASTNode } from '../lib/ast-validator';

export function functionEquals(func1, func2) {
    if (!func1 || !func2)
        return false;

    return  func1.name === func2.name &&
            _.isEqual(
                func1.parameters.map(p => ({ varType: p.varType, arraySizes: p.arraySizes })),
                func2.parameters.map(p => ({ varType: p.varType, arraySizes: p.arraySizes }))
            );
}

export function functionFullEquals(func1, func2) {
    if (!func1 || !func2)
        return false;

    return  func1.name === func2.name &&
            func1.returnType === func2.returnType &&
            _.isEqual(
                func1.parameters.map(p => ({ name: p.name, varType: p.varType, arraySizes: p.arraySizes })),
                func2.parameters.map(p => ({ name: p.name, varType: p.varType, arraySizes: p.arraySizes }))
            );
}

export function typeEquals(type1, type2) {
    if (!type1 || !type2)
        return false;

    const integerType = { varType: 'integer', arraySizes: [] };
    const floatType = { varType: 'float', arraySizes: [] };

    // Special case, integer === float but float !== integer
    if (type1.varType === integerType.varType &&
        arraySizesEquals(type1.arraySizes, integerType.arraySizes) &&
        type2.varType === floatType.varType &&
        arraySizesEquals(type2.arraySizes, floatType.arraySizes))
        return true;

    return type1.varType === type2.varType &&
        arraySizesEquals(type1.arraySizes, type2.arraySizes);
}

function arraySizesEquals(arraySizes1: any[], arraySizes2: any[]) {
    if (arraySizes1.length !== arraySizes2.length)
        return false;
    return arraySizes2.every((s, i) => s === 0 || s === arraySizes1[i]);
}

export function stringifyFunction(func: ASTNode) {
    const visibility = func.visiblity ? `${func.visibility} ` : '';
    return `${visibility}${func.name}(${func.parameters.map(p => `${p.name}: ${stringifyType(p)}`).join(', ')}) -> ${func.returnType}`;
}

export function stringifyType(type) {
    if (!type)
        return 'undeclared';
    return `${type.varType}${type.arraySizes.map(s => `[${s > 0 ? s : ''}]`).join('')}`;
}

export function isLValue(expression) {
    // Check left expression is modifiable
    if (expression.type !== 'IdentifierExpression' &&
        expression.type !== 'MemberIndexExpression' &&
        expression.type !== 'FunctionCallExpression') {
        return false;
    }

    // Check left expression ends with identifier or index expression
    while (expression.chainedExpression) {
        expression = expression.chainedExpression;
    }

    return expression.type !== 'FunctionCallExpression';
}

export function formatType(type: string) {
    switch (type) {
        case 'local':
            return 'local variable';
        case 'data':
            return 'data member';
        default:
            return type;
    }
}

export function printSymbolTable(table, print: (str: string) => void = str => process.stdout.write(str)) {
    print(table.toString());
    print('\n');
    table._table.forEach(e => {
        if (e.symbolTable)
            printSymbolTable(e.symbolTable, print);
    });
}
