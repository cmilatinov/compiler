import { SymbolTable } from '../../../lib/symbol-table';
import {
    BasicOperatorDefinition,
    OperatorDefinitionTable,
    OperatorImplementation
} from '../../operator/operator-definitions';
import { Operator } from '../../operator/operators';
import { BOOLEAN_TYPE, FunctionTypeSpecifier, INTEGER_TYPE } from '../../type/type-specifier';
import { InstructionX64 } from './instruction';

export class OperatorImplementationsX64 {
    private static _defaultUnaryOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, first) => {
            generator.mov(returnValue.address, first.address);
            generator.instruction(instruction, returnValue.address.toString());
        };
    }

    private static _defaultBinaryOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, first, second) => {
            generator.mov(returnValue.address, first.address);
            generator.instruction(
                instruction,
                returnValue.address.toString(),
                second.address.toString()
            );
        };
    }

    private static _mulBinaryOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, first, second) => {
            generator.mov(returnValue.address, first.address);
            generator.instruction(instruction, second.address.toString());
        };
    }

    private static _logicalNotOperatorImpl(): OperatorImplementation {
        return (generator, returnValue, first) => {
            this._defaultBinaryOperatorImpl(InstructionX64.NOT);
            const firstAddr = first.address.toString();
            generator.instruction(InstructionX64.TEST, firstAddr, firstAddr);
            generator.instruction(InstructionX64.MOV, firstAddr, '0');
            generator.instruction(InstructionX64.SETE, returnValue.address.toString());
        };
    }

    private static _boolTypecastOperatorImpl(): OperatorImplementation {
        return (generator, returnValue, first) => {
            generator.mov(returnValue.address, first.address);
            const firstAddr = first.address.toString();
            generator.instruction(InstructionX64.TEST, firstAddr, firstAddr);
            generator.instruction(InstructionX64.MOV, firstAddr, '0');
            generator.instruction(InstructionX64.SETNE, returnValue.address.toString());
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

        // Multiplication / Division / Remainder
        table.addDefinition(
            Operator.MULTIPLICATION,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._mulBinaryOperatorImpl(InstructionX64.IMUL)
            )
        );
        table.addDefinition(
            Operator.DIVISION,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._mulBinaryOperatorImpl(InstructionX64.IDIV)
            )
        );
        table.addDefinition(
            Operator.REMAINDER,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._mulBinaryOperatorImpl(InstructionX64.IDIV)
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

        // Bitwise Operators
        table.addDefinition(
            Operator.BITWISE_NOT,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE),
                this._defaultUnaryOperatorImpl(InstructionX64.NOT)
            )
        );

        table.addDefinition(
            Operator.BITWISE_AND,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._defaultBinaryOperatorImpl(InstructionX64.AND)
            )
        );

        table.addDefinition(
            Operator.BITWISE_OR,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._defaultBinaryOperatorImpl(InstructionX64.OR)
            )
        );

        table.addDefinition(
            Operator.BITWISE_XOR,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._defaultBinaryOperatorImpl(InstructionX64.XOR)
            )
        );

        // Logical Operators
        table.addDefinition(
            Operator.LOGICAL_NOT,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([BOOLEAN_TYPE], BOOLEAN_TYPE),
                this._logicalNotOperatorImpl()
            )
        );

        table.addDefinition(
            Operator.LOGICAL_AND,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([BOOLEAN_TYPE, BOOLEAN_TYPE], BOOLEAN_TYPE),
                this._defaultBinaryOperatorImpl(InstructionX64.AND)
            )
        );

        table.addDefinition(
            Operator.LOGICAL_OR,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([BOOLEAN_TYPE, BOOLEAN_TYPE], BOOLEAN_TYPE),
                this._defaultBinaryOperatorImpl(InstructionX64.OR)
            )
        );

        // Type casts
        table.addDefinition(
            Operator.TYPECAST,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([BOOLEAN_TYPE], INTEGER_TYPE),
                () => {}
            )
        );
        table.addDefinition(
            Operator.TYPECAST,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE], BOOLEAN_TYPE),
                this._boolTypecastOperatorImpl()
            )
        );

        // Shift Operators
        // TODO: Add single-byte integer type
        // table.addDefinition(
        //     Operator.LEFT_SHIFT,
        //     new BasicOperatorDefinition(
        //         new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
        //         this._defaultBinaryOperatorImpl(InstructionX64.SAL)
        //     )
        // );
        // table.addDefinition(
        //     Operator.RIGHT_SHIFT,
        //     new BasicOperatorDefinition(
        //         new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
        //         this._defaultBinaryOperatorImpl(InstructionX64.SAR)
        //     )
        // );
    }

    private static _registerOperatorRules(
        table: OperatorDefinitionTable,
        symbolTable: SymbolTable
    ) {}
}
