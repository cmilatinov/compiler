import _ from 'lodash';
import { BaseException, TypeException } from '../../lib/exceptions';
import { SymbolTable } from '../../lib/symbol-table';
import {
    BaseTypeSpecifier,
    BOOLEAN_TYPE,
    FLOAT_TYPE,
    FunctionTypeSpecifier,
    INTEGER_TYPE,
    TypeSpecifier,
    VOID_TYPE
} from '../type/type-specifier';
import {
    EmptyOperatorDefinition,
    OperatorDefinition,
    OperatorDefinitionTable
} from './operator-definitions';
import { BaseOptions, MemberAccessOptions, NewOptions, TypecastOptions } from './operator-options';
import {
    AdditiveOperatorList,
    BitwiseOperatorList,
    EqualityOperatorList,
    LogicalOperatorList,
    MultiplicativeOperatorList,
    Operator,
    PowerOperatorList,
    RelationalOperatorList,
    ShiftOperatorList
} from './operators';

export class OperatorImplementations {
    public static createOperatorTable(symbolTable: SymbolTable) {
        const table = new OperatorDefinitionTable();
        this._registerOperatorEntries(table);
        this._registerOperatorRules(table, symbolTable);
        return table;
    }

    private static _registerOperatorEntries(table: OperatorDefinitionTable) {
        // Increment / Decrement operators
        table.addDefinitionMultiple(
            [Operator.INCREMENT, Operator.DECREMENT],
            [
                // Prefix operators
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE.createReferenceType()], INTEGER_TYPE)
                ),
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE.createReferenceType()], FLOAT_TYPE)
                ),

                // Postfix w/ dummy int parameter
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier(
                        [INTEGER_TYPE.createReferenceType(), INTEGER_TYPE],
                        INTEGER_TYPE
                    )
                ),
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier(
                        [FLOAT_TYPE.createReferenceType(), INTEGER_TYPE],
                        FLOAT_TYPE
                    )
                )
            ]
        );

        // Unary plus / minus operators
        table.addDefinitionMultiple(
            [Operator.UNARY_PLUS, Operator.UNARY_MINUS],
            [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE)
                ),
                new EmptyOperatorDefinition(new FunctionTypeSpecifier([FLOAT_TYPE], FLOAT_TYPE))
            ]
        );

        // Logical Not operator
        table.addDefinition(
            Operator.LOGICAL_NOT,
            new EmptyOperatorDefinition(new FunctionTypeSpecifier([BOOLEAN_TYPE], BOOLEAN_TYPE))
        );

        // Bitwise Not operator
        table.addDefinition(
            Operator.BITWISE_NOT,
            new EmptyOperatorDefinition(new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE))
        );

        // Arithmetic operators
        table.addDefinitionMultiple(
            [...PowerOperatorList, ...MultiplicativeOperatorList, ...AdditiveOperatorList],
            [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE)
                ),
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE)
                )
            ]
        );

        // Shift & Bitwise operators
        table.addDefinitionMultiple(
            [...ShiftOperatorList, ...BitwiseOperatorList],
            [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE)
                )
            ]
        );

        // Relational and equality operators
        table.addDefinitionMultiple(
            [...RelationalOperatorList, ...EqualityOperatorList],
            [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE)
                ),
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE)
                )
            ]
        );

        // Logical operators
        table.addDefinitionMultiple(
            [...LogicalOperatorList],
            [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([BOOLEAN_TYPE, BOOLEAN_TYPE], BOOLEAN_TYPE)
                )
            ]
        );
    }

    private static _registerOperatorRules(
        table: OperatorDefinitionTable,
        symbolTable: SymbolTable
    ) {
        const operators: (keyof typeof Operator)[] = [
            'NEW',
            'NEW_ARRAY',
            'DELETE',
            'DELETE_ARRAY',
            'MEMBER_ACCESS',
            'MEMBER_ACCESS_DEREFERENCE',
            'FUNCTION_CALL',
            'TYPECAST',
            'INDEX',
            'ADDRESS_OF',
            'DEREFERENCE',
            'NULL_COALESCING',
            'TERNARY',
            'ASSIGNMENT'
        ];
        operators.forEach((op) => {
            const fnName = `_${_.camelCase(op)}Op`;
            const fn = this[fnName];
            if (fn) {
                table.addDefinitionRule(Operator[op], fn.bind(this, symbolTable));
            }
        });
    }

    private static _newOp(
        symbolTable: SymbolTable,
        { location, typeSpecifier }: NewOptions
    ): OperatorDefinition[] | BaseException {
        if (typeSpecifier.isPointerType() || typeSpecifier.isPrimitiveType()) {
            const returnType = typeSpecifier.createPointerType();
            return [
                new EmptyOperatorDefinition(new FunctionTypeSpecifier([], returnType)),
                new EmptyOperatorDefinition(new FunctionTypeSpecifier([typeSpecifier], returnType))
            ];
        }

        // TODO: Lookup class constructor
        symbolTable.lookup(typeSpecifier.value);

        return new TypeException('', location);
    }

    private static _newArrayOp(
        symbolTable: SymbolTable,
        { location, typeSpecifier }: NewOptions,
        typeList: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (typeSpecifier.isPointerType() || typeSpecifier.isPrimitiveType()) {
            const returnType = typeList.reduce((acc) => acc.createPointerType(), typeSpecifier);
            return [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier(
                        typeList.map(() => INTEGER_TYPE),
                        returnType
                    )
                )
            ];
        }

        // TODO: Lookup class constructor with no args
        symbolTable.lookup(typeSpecifier.value);

        return new TypeException('', location);
    }

    private static _deleteOp(
        symbolTable: SymbolTable,
        { location }: BaseOptions,
        [expression]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (expression.isPointerType()) {
            return [
                new EmptyOperatorDefinition(new FunctionTypeSpecifier([expression], VOID_TYPE))
            ];
        }
        return new TypeException('Delete expression must evaluate to pointer type.', location);
    }

    private static _deleteArrayOp(
        symbolTable: SymbolTable,
        options: BaseOptions,
        parameters: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        return this._deleteOp(symbolTable, options, parameters);
    }

    // TODO
    private static _memberAccessOp(
        symbolTable: SymbolTable,
        { location, identifier }: MemberAccessOptions,
        [expression]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (!expression.isClassType()) {
            return new TypeException(
                `Illegal member access on non-class type '${expression.toString()}'.`,
                location
            );
        }

        // TODO: Lookup class member with identifier
        const exprType = expression.asType();
        symbolTable.lookup(exprType.value);

        return new TypeException(`Unimplemented operator.`, location);
    }

    // TODO
    private static _memberAccessDereferenceOp(
        symbolTable: SymbolTable,
        { location, identifier }: MemberAccessOptions,
        [expression]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (!expression.isPointerType()) {
            return new TypeException(
                `Illegal dereferenced member access on ` +
                    `non-pointer type '${expression.toString()}'.`,
                location
            );
        }

        const classType = expression.createDereferencedType();
        if (!classType.isClassType()) {
            return new TypeException(
                `Illegal dereferenced member access on ` +
                    `primitive pointer type '${expression.toString()}'.`,
                location
            );
        }

        // TODO: Lookup class member with identifier

        return new TypeException(`Unimplemented operator.`, location);
    }

    private static _functionCallOp(
        symbolTable: SymbolTable,
        { location }: BaseOptions,
        [fn, ...args]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (fn.isFunctionType()) {
            const fnType = fn.asFunctionType();
            if (
                (!fnType.vararg && fnType.parameters.length !== args.length) ||
                (fnType.vararg && args.length < fnType.parameters.length)
            ) {
                return new TypeException(
                    `Function of type '${fnType.toString()}' ` +
                        `called with wrong number of arguments. ` +
                        `Expected ${fnType.parameters.length} ` +
                        `argument${fnType.parameters.length !== 1 ? 's' : ''} ` +
                        `but function call has ${args.length} ` +
                        `argument${args.length !== 1 ? 's' : ''}.`,
                    location
                );
            }

            if (
                fnType.parameters.some((p, i) => !p.equals(args[i]) && !args[i].canImplicitCast(p))
            ) {
                return new TypeException(
                    `Function of type '${fnType.toString()}' ` +
                        `called with wrong argument types. ` +
                        `Expected ${fnType.parameters
                            .map((p) => `'${p.toString()}'`)
                            .join(', ')} ` +
                        `but function call was executed with ` +
                        `${args.map((a) => `'${a.toString()}'`).join(', ')}.`,
                    location
                );
            }

            return [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier(
                        [fn, ...fnType.parameters],
                        fnType.returnType,
                        fnType.vararg
                    )
                )
            ];
        }

        // TODO
        if (fn.isClassType()) {
        }

        return new TypeException(
            `Illegal function call expression on non-callable type '${fn.toString()}'.`,
            location
        );
    }

    private static _typecastOp(
        symbolTable: SymbolTable,
        { typeSpecifier }: TypecastOptions,
        [expression]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        return [
            new EmptyOperatorDefinition(new FunctionTypeSpecifier([expression], typeSpecifier))
        ];
    }

    private static _indexOp(
        symbolTable: SymbolTable,
        { location }: BaseOptions,
        [expression, index]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (expression.isPointerType() && !index.equals(INTEGER_TYPE)) {
            return new TypeException(
                `Index expression must evaluate to type ` +
                    `'${INTEGER_TYPE.toString()}', instead got '${index.toString()}'.`,
                location
            );
        } else if (expression.isPointerType()) {
            return [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier(
                        [expression, index],
                        expression.createDereferencedType()
                    )
                )
            ];
        }
        // NOTE: Overloaded index operator on class types
        // will be implemented through a static table entry.
        return [];
    }

    private static _addressOfOp(
        symbolTable: SymbolTable,
        options: BaseOptions,
        [expression]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        return [
            new EmptyOperatorDefinition(
                new FunctionTypeSpecifier([expression], expression.createPointerType())
            )
        ];
    }

    private static _dereferenceOp(
        symbolTable: SymbolTable,
        { location }: BaseOptions,
        [expression]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (!expression.isPointerType()) {
            return new TypeException(
                `Dereference operator must be used on a pointer type only, ` +
                    `instead got '${expression.toString()}'.`,
                location
            );
        }
        return [
            new EmptyOperatorDefinition(
                new FunctionTypeSpecifier([expression], expression.createDereferencedType())
            )
        ];
    }

    private static _nullCoalescingOp(
        symbolTable: SymbolTable,
        { location }: BaseOptions,
        [first]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (!first.isPointerType()) {
            return new TypeException(
                `Null coalescing expression may only be applied to ` +
                    `pointer types, instead got '${first.toString()}'.`,
                location
            );
        }
        return [new EmptyOperatorDefinition(new FunctionTypeSpecifier([first, first], first))];
    }

    private static _ternaryOp(
        symbolTable: SymbolTable,
        options: BaseOptions,
        [condition, trueExp]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        return [
            new EmptyOperatorDefinition(
                new FunctionTypeSpecifier([condition, trueExp, trueExp], trueExp)
            )
        ];
    }

    private static _assignmentOp(
        symbolTable: SymbolTable,
        options: BaseOptions,
        [left]: BaseTypeSpecifier[]
    ): OperatorDefinition[] | BaseException {
        if (left.isReferenceType())
            return [
                new EmptyOperatorDefinition(
                    new FunctionTypeSpecifier([left, left.createUnreferencedType()], left)
                )
            ];
        return [
            new EmptyOperatorDefinition(
                new FunctionTypeSpecifier([left.createReferenceType(), left], left)
            )
        ];
    }
}
