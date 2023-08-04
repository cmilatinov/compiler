import { SymbolTable } from '../../../lib/symbol-table';
import {
    BasicOperatorDefinition,
    EmptyOperatorDefinition,
    OperatorDefinitionTable,
    OperatorImplementation
} from '../../operator/operator-definitions';
import { Operator } from '../../operator/operators';
import {
    BOOLEAN_TYPE,
    DOUBLE_TYPE,
    FLOAT_TYPE,
    FunctionTypeSpecifier,
    INTEGER_TYPE
} from '../../type/type-specifier';
import { InstructionX64 } from './instruction';
import { ImmediateAddressX64, RegisterAddressX64 } from './address';

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

    private static _remainderOperatorImpl(): OperatorImplementation {
        return (generator, returnValue, first, second) => {
            generator.instruction(InstructionX64.IDIV, second.address.toString());
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
            const firstAddr = first.address.toString();
            generator.instruction(InstructionX64.TEST, firstAddr, firstAddr);
            generator.instruction(InstructionX64.MOV, firstAddr, '0');
            generator.instruction(InstructionX64.SETNE, returnValue.address.toString());
        };
    }

    private static _intFloatTypecastOperatorImpl(): OperatorImplementation {
        return (generator, returnValue, first) => {
            generator.instruction(
                InstructionX64.CVTSI2SS,
                returnValue.address.toString(),
                first.address.toString()
            );
        };
    }

    private static _typecastOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, first) => {
            generator.instruction(
                instruction,
                returnValue.address.toString(),
                first.address.toString()
            );
        };
    }

    private static _floatIntTypecastOperatorImpl(): OperatorImplementation {
        return (generator, returnValue, first) => {
            generator.instruction(
                InstructionX64.CVTTSD2SI,
                returnValue.address.toString(),
                first.address.toString()
            );
        };
    }

    private static _floatDoubleTypecastOperatorImpl(): OperatorImplementation {
        return (generator, returnValue, first) => {
            generator.instruction(
                InstructionX64.CVTSS2SD,
                returnValue.address.toString(),
                first.address.toString()
            );
        };
    }

    private static _signExtendImpl(): OperatorImplementation {
        return (generator, returnValue, first) => {
            generator.instruction(
                InstructionX64.MOVSX,
                returnValue.address.toString(),
                first.address.toString()
            );
        };
    }

    private static _shiftOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, first, second) => {
            // Truncate source address if larger than 1 byte
            let addr = second.address;
            if (second.address instanceof RegisterAddressX64) {
                addr = RegisterAddressX64.createFromOther(second.address, 1);
            } else if (second.address instanceof ImmediateAddressX64) {
                addr = new ImmediateAddressX64(second.address.value, 1);
            }
            generator.mov(returnValue.address, first.address);
            generator.instruction(instruction, returnValue.address.toString(), addr.toString());
        };
    }

    private static _intComparisonOperatorImpl(instruction: InstructionX64): OperatorImplementation {
        return (generator, returnValue, first, second) => {
            const firstAddr = first.address.toString();
            generator.instruction(InstructionX64.CMP, firstAddr, second.address.toString());
            generator.instruction(InstructionX64.MOV, firstAddr, '0');
            generator.instruction(instruction, returnValue.address.toString());
        };
    }

    private static _floatComparisonOperatorImpl(
        instruction: InstructionX64
    ): OperatorImplementation {
        return (generator, returnValue, first, second) => {
            generator.instruction(instruction, first.address.toString(), second.address.toString());
            generator.mov(returnValue.address, first.address);
            generator.instruction(InstructionX64.AND, returnValue.address.toString(), '1');
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
        table.addDefinitionMultiple(
            [Operator.ADDITION],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                    this._defaultBinaryOperatorImpl(InstructionX64.ADD)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE),
                    this._defaultBinaryOperatorImpl(InstructionX64.ADDSS)
                )
            ]
        );
        table.addDefinitionMultiple(
            [Operator.SUBTRACTION],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                    this._defaultBinaryOperatorImpl(InstructionX64.SUB)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE),
                    this._defaultBinaryOperatorImpl(InstructionX64.SUBSS)
                )
            ]
        );

        // Multiplication / Division
        table.addDefinitionMultiple(
            [Operator.MULTIPLICATION],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                    this._mulBinaryOperatorImpl(InstructionX64.IMUL)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE),
                    this._defaultBinaryOperatorImpl(InstructionX64.MULSS)
                )
            ]
        );
        table.addDefinitionMultiple(
            [Operator.DIVISION],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                    this._mulBinaryOperatorImpl(InstructionX64.IDIV)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], FLOAT_TYPE),
                    this._defaultBinaryOperatorImpl(InstructionX64.DIVSS)
                )
            ]
        );

        // Remainder
        table.addDefinition(
            Operator.REMAINDER,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._remainderOperatorImpl()
            )
        );

        // Unary plus / minus
        table.addDefinitionMultiple(
            [Operator.UNARY_MINUS],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE),
                    this._defaultUnaryOperatorImpl(InstructionX64.NEG)
                )
            ]
        );
        table.addDefinitionMultiple(
            [Operator.UNARY_PLUS],
            [new EmptyOperatorDefinition(new FunctionTypeSpecifier([INTEGER_TYPE], INTEGER_TYPE))]
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
        table.addDefinitionMultiple(
            [Operator.TYPECAST],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([BOOLEAN_TYPE], INTEGER_TYPE),
                    this._signExtendImpl()
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE], BOOLEAN_TYPE),
                    this._boolTypecastOperatorImpl()
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE], FLOAT_TYPE),
                    this._typecastOperatorImpl(InstructionX64.CVTSI2SS)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE], DOUBLE_TYPE),
                    this._typecastOperatorImpl(InstructionX64.CVTSI2SD)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE], INTEGER_TYPE),
                    this._typecastOperatorImpl(InstructionX64.CVTTSS2SI)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE], DOUBLE_TYPE),
                    this._typecastOperatorImpl(InstructionX64.CVTSS2SD)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([DOUBLE_TYPE], INTEGER_TYPE),
                    this._typecastOperatorImpl(InstructionX64.CVTTSD2SI)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([DOUBLE_TYPE], FLOAT_TYPE),
                    this._typecastOperatorImpl(InstructionX64.CVTSD2SS)
                )
            ]
        );

        // Shift Operators
        table.addDefinition(
            Operator.LEFT_SHIFT,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._shiftOperatorImpl(InstructionX64.SAL)
            )
        );
        table.addDefinition(
            Operator.RIGHT_SHIFT,
            new BasicOperatorDefinition(
                new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], INTEGER_TYPE),
                this._shiftOperatorImpl(InstructionX64.SAR)
            )
        );

        // Equality Operators
        table.addDefinitionMultiple(
            [Operator.EQUAL],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([BOOLEAN_TYPE, BOOLEAN_TYPE], BOOLEAN_TYPE),
                    this._intComparisonOperatorImpl(InstructionX64.SETE)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE),
                    this._intComparisonOperatorImpl(InstructionX64.SETE)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE),
                    this._floatComparisonOperatorImpl(InstructionX64.CMPEQSS)
                )
            ]
        );
        table.addDefinitionMultiple(
            [Operator.NOT_EQUAL],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([BOOLEAN_TYPE, BOOLEAN_TYPE], BOOLEAN_TYPE),
                    this._intComparisonOperatorImpl(InstructionX64.SETNE)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE),
                    this._intComparisonOperatorImpl(InstructionX64.SETNE)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE),
                    this._floatComparisonOperatorImpl(InstructionX64.CMPNEQSS)
                )
            ]
        );

        // Relative Comparison Operators
        table.addDefinitionMultiple(
            [Operator.LESS_THAN],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE),
                    this._intComparisonOperatorImpl(InstructionX64.SETL)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE),
                    this._floatComparisonOperatorImpl(InstructionX64.CMPLTSS)
                )
            ]
        );
        table.addDefinitionMultiple(
            [Operator.LESS_THAN_EQUAL],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE),
                    this._intComparisonOperatorImpl(InstructionX64.SETLE)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE),
                    this._floatComparisonOperatorImpl(InstructionX64.CMPLESS)
                )
            ]
        );
        table.addDefinitionMultiple(
            [Operator.GREATER_THAN],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE),
                    this._intComparisonOperatorImpl(InstructionX64.SETG)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE),
                    this._floatComparisonOperatorImpl(InstructionX64.CMPNLESS)
                )
            ]
        );
        table.addDefinitionMultiple(
            [Operator.GREATER_THAN_EQUAL],
            [
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([INTEGER_TYPE, INTEGER_TYPE], BOOLEAN_TYPE),
                    this._intComparisonOperatorImpl(InstructionX64.SETGE)
                ),
                new BasicOperatorDefinition(
                    new FunctionTypeSpecifier([FLOAT_TYPE, FLOAT_TYPE], BOOLEAN_TYPE),
                    this._floatComparisonOperatorImpl(InstructionX64.CMPNLTSS)
                )
            ]
        );
    }

    private static _registerOperatorRules(
        table: OperatorDefinitionTable,
        symbolTable: SymbolTable
    ) {}
}
