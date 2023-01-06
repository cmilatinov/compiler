import { SymbolTable } from '../../../lib/symbol-table';
import {
    BasicOperatorDefinition,
    OperatorDefinitionTable,
    OperatorImplementation
} from '../../operator/operator-definitions';
import { Operator } from '../../operator/operators';
import { FunctionTypeSpecifier, INTEGER_TYPE } from '../../type/type-specifier';
import { InstructionX64 } from './instruction';

export class OperatorImplementationsX64 {
    private static _defaultUnaryOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, ...[first]) => {
            if (returnValue.address.equals(first.address)) {
                generator.instruction(instruction, returnValue.address.toString());
            } else {
                generator.mov(returnValue.address, first.address);
                generator.instruction(instruction, returnValue.address.toString());
            }
        };
    }

    private static _defaultBinaryOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, ...[first, second]) => {
            const equalsFirst = returnValue.address.equals(first.address);
            const equalsSecond = returnValue.address.equals(second.address);
            if (equalsFirst || equalsSecond) {
                const src = equalsFirst ? second.address : first.address;
                generator.instruction(instruction, returnValue.address.toString(), src.toString());
            } else {
                generator.mov(returnValue.address, first.address);
                generator.instruction(
                    instruction,
                    returnValue.address.toString(),
                    second.address.toString()
                );
            }
        };
    }

    private static _mulBinaryOperation(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, ...[first, second]) => {
            generator.mov(returnValue.address, first.address);
            generator.instruction(instruction, second.address.toString());
        };
    }

    public static createOperatorTable(symbolTable: SymbolTable) {
        const table = new OperatorDefinitionTable();
        this._registerOperatorEntries(table);
        this._registerOperatorRules(table, symbolTable);
        return table;
    }

    private static _registerOperatorEntries(table: OperatorDefinitionTable) {
        // Addition / Subtraction
        table.addDefinition(
            Operator.ADDITION,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._defaultBinaryOperatorImpl(InstructionX64.ADD)
            )
        );
        // table.addDefinition(
        //     Operator.ADDITION,
        //     new BasicOperatorDefinition(
        //         new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE),
        //         this._defaultBinaryOperatorImpl(InstructionX64.ADDSS)
        //     )
        // );
        table.addDefinition(
            Operator.SUBTRACTION,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._defaultBinaryOperatorImpl(InstructionX64.SUB)
            )
        );
        // table.addDefinition(
        //     Operator.SUBTRACTION,
        //     new BasicOperatorDefinition(
        //         new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE),
        //         this._defaultBinaryOperatorImpl(InstructionX64.SUBSS)
        //     )
        // );

        // Multiplication / Division
        table.addDefinition(
            Operator.MULTIPLICATION,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._mulBinaryOperation(InstructionX64.IMUL)
            )
        );
        table.addDefinition(
            Operator.DIVISION,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._mulBinaryOperation(InstructionX64.IDIV)
            )
        );

        // Unary minus
        table.addDefinition(
            Operator.UNARY_MINUS,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE),
                this._defaultUnaryOperatorImpl(InstructionX64.NEG)
            )
        );

        // // Logical Not operator
        // table.addDefinition(
        //     Operator.LOGICAL_NOT,
        //     new EmptyOperatorDefinition(new FunctionTypeSpecifier([BOOLEAN_TYPE], BOOLEAN_TYPE))
        // );
        //
        // // Bitwise Not operator
        // table.addDefinition(
        //     Operator.BITWISE_NOT,
        //     new EmptyOperatorDefinition(new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE))
        // );
        //
        // // Arithmetic operators
        // table.addDefinitionMultiple(
        //     [...PowerOperatorList, ...MultiplicativeOperatorList, ...AdditiveOperatorList],
        //     [
        //         new EmptyOperatorDefinition(
        //             new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE)
        //         ),
        //         new EmptyOperatorDefinition(
        //             new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE)
        //         )
        //     ]
        // );
        //
        // // Shift & Bitwise operators
        // table.addDefinitionMultiple(
        //     [...ShiftOperatorList, ...BitwiseOperatorList],
        //     [
        //         new EmptyOperatorDefinition(
        //             new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE)
        //         )
        //     ]
        // );
        //
        // // Relational and equality operators
        // table.addDefinitionMultiple(
        //     [...RelationalOperatorList, ...EqualityOperatorList],
        //     [
        //         new EmptyOperatorDefinition(
        //             new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE)
        //         ),
        //         new EmptyOperatorDefinition(
        //             new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE)
        //         )
        //     ]
        // );
        //
        // // Logical operators
        // table.addDefinitionMultiple(
        //     [...LogicalOperatorList],
        //     [
        //         new EmptyOperatorDefinition(
        //             new FunctionTypeSpecifier([BOOLEAN_TYPE, BOOLEAN_TYPE], BOOLEAN_TYPE)
        //         )
        //     ]
        // );
    }

    private static _registerOperatorRules(
        table: OperatorDefinitionTable,
        symbolTable: SymbolTable
    ) {}
}
