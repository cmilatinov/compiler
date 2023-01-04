import { addressEquals, CodeGeneratorASM } from '../../../lib/code-generator';
import { SymbolTable } from '../../../lib/symbol-table';
import {
    BasicOperatorDefinition,
    EmptyOperatorDefinition,
    OperatorDefinition,
    OperatorDefinitionTable,
    OperatorImplementation
} from '../../operator/operator-definitions';
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
} from '../../operator/operators';
import {
    BOOLEAN_TYPE,
    FLOAT_TYPE,
    FunctionTypeSpecifier,
    INTEGER_TYPE
} from '../../type/type-specifier';
import { InstructionX64 } from './instruction';

export class OperatorImplementationsX64 {
    private static _defaultUnaryOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, ...[first]) => {
            if (addressEquals(returnValue.address, first.address)) {
                const addr = generator.asmAddress(returnValue.address);
                generator.instruction(instruction, addr);
            } else {
                const returnAddr = generator.asmAddress(returnValue.address);
                const firstAddr = generator.asmAddress(first.address);
                generator.instruction(InstructionX64.MOV, returnAddr, firstAddr);
                generator.instruction(instruction, returnAddr);
            }
        };
    }

    private static _defaultBinaryOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, ...[first, second]) => {
            if (addressEquals(returnValue.address, first.address)) {
                const destAddr = generator.asmAddress(returnValue.address);
                const srcAddr = generator.asmAddress(second.address);
                generator.instruction(instruction, destAddr, srcAddr);
            } else {
                const returnAddr = generator.asmAddress(returnValue.address);
                const firstAddr = generator.asmAddress(first.address);
                const secondAddr = generator.asmAddress(second.address);
                generator.instruction(InstructionX64.MOV, returnAddr, firstAddr);
                generator.instruction(instruction, returnAddr, secondAddr);
            }
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

        // Unary minus
        table.addDefinition(
            Operator.UNARY_MINUS,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE),
                this._defaultUnaryOperatorImpl(InstructionX64.NEG)
            )
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
    ) {}
}
