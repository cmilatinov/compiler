export enum Operator {
    NEW = 'new',
    NEW_ARRAY = 'new[]',

    DELETE = 'delete',
    DELETE_ARRAY = 'delete[]',

    MEMBER_ACCESS = '.',
    MEMBER_ACCESS_DEREFERENCE = '->',

    FUNCTION_CALL = '()',

    INCREMENT = '++',
    DECREMENT = '--',

    TYPECAST = 'type()',

    INDEX = '[]',

    UNARY_PLUS = '+',
    UNARY_MINUS = '-',
    LOGICAL_NOT = '!',
    BITWISE_NOT = '~',
    ADDRESS_OF = '&',
    DEREFERENCE = '*',

    POWER = '^^',

    ADDITION = '+',
    SUBTRACTION = '-',
    MULTIPLICATION = '*',
    DIVISION = '/',
    REMAINDER = '%',

    LEFT_SHIFT = '<<',
    RIGHT_SHIFT = '>>',

    LESS_THAN = '<',
    GREATER_THAN = '>',
    LESS_THAN_EQUAL = '<=',
    GREATER_THAN_EQUAL = '>=',

    EQUAL = '==',
    NOT_EQUAL = '!=',

    BITWISE_AND = '&',
    BITWISE_OR = '|',
    BITWISE_XOR = '^',

    LOGICAL_AND = '&&',
    LOGICAL_OR = '||',

    NULL_COALESCING = '??',

    TERNARY = '?:',

    NULL_COALESCING_ASSIGNMENT = '??=',
    LEFT_SHIFT_ASSIGNMENT = '<<=',
    RIGHT_SHIFT_ASSIGNMENT = '>>=',
    BITWISE_AND_ASSIGNMENT = '&=',
    BITWISE_OR_ASSIGNMENT = '|=',
    BITWISE_XOR_ASSIGNMENT = '^=',
    MULTIPLICATION_ASSIGNMENT = '*=',
    DIVISION_ASSIGNMENT = '/=',
    REMAINDER_ASSIGNMENT = '%=',
    ADDITION_ASSIGNMENT = '+=',
    SUBTRACTION_ASSIGNMENT = '-=',
    ASSIGNMENT = '='
}

export const NewOperatorList = [Operator.NEW, Operator.NEW_ARRAY] as const;

export const DeleteOperatorList = [Operator.DELETE, Operator.DELETE_ARRAY] as const;

export const MemberAccessOperatorList = [
    Operator.MEMBER_ACCESS,
    Operator.MEMBER_ACCESS_DEREFERENCE
] as const;

export const FunctionCallOperatorList = [Operator.FUNCTION_CALL] as const;

export const PostfixOperatorList = [Operator.INCREMENT, Operator.DECREMENT] as const;

export const TypeCastOperatorList = [Operator.TYPECAST] as const;

export const IndexOperatorList = [Operator.INDEX] as const;

export const UnaryOperatorList = [
    Operator.INCREMENT,
    Operator.DECREMENT,
    Operator.UNARY_PLUS,
    Operator.UNARY_MINUS,
    Operator.LOGICAL_NOT,
    Operator.BITWISE_NOT,
    Operator.ADDRESS_OF,
    Operator.DEREFERENCE
] as const;

export const PowerOperatorList = [Operator.POWER] as const;

export const MultiplicativeOperatorList = [
    Operator.MULTIPLICATION,
    Operator.DIVISION,
    Operator.REMAINDER
] as const;

export const AdditiveOperatorList = [Operator.ADDITION, Operator.SUBTRACTION] as const;

export const ShiftOperatorList = [Operator.LEFT_SHIFT, Operator.RIGHT_SHIFT] as const;

export const RelationalOperatorList = [
    Operator.LESS_THAN,
    Operator.GREATER_THAN,
    Operator.LESS_THAN_EQUAL,
    Operator.GREATER_THAN_EQUAL
] as const;

export const EqualityOperatorList = [Operator.EQUAL, Operator.NOT_EQUAL] as const;

export const BitwiseOperatorList = [
    Operator.BITWISE_AND,
    Operator.BITWISE_OR,
    Operator.BITWISE_XOR
] as const;

export const LogicalOperatorList = [Operator.LOGICAL_AND, Operator.LOGICAL_OR] as const;

export const NullCoalescingOperatorList = [Operator.NULL_COALESCING] as const;

export const TernaryOperatorList = [Operator.TERNARY] as const;

export const AssignmentOperatorList = [
    Operator.NULL_COALESCING_ASSIGNMENT,
    Operator.LEFT_SHIFT_ASSIGNMENT,
    Operator.RIGHT_SHIFT_ASSIGNMENT,
    Operator.BITWISE_AND_ASSIGNMENT,
    Operator.BITWISE_OR_ASSIGNMENT,
    Operator.BITWISE_XOR_ASSIGNMENT,
    Operator.MULTIPLICATION_ASSIGNMENT,
    Operator.DIVISION_ASSIGNMENT,
    Operator.REMAINDER_ASSIGNMENT,
    Operator.ADDITION_ASSIGNMENT,
    Operator.SUBTRACTION_ASSIGNMENT,
    Operator.ASSIGNMENT
] as const;

export const BinaryOperatorList = [
    ...IndexOperatorList,
    ...PowerOperatorList,
    ...MultiplicativeOperatorList,
    ...AdditiveOperatorList,
    ...ShiftOperatorList,
    ...RelationalOperatorList,
    ...EqualityOperatorList,
    ...BitwiseOperatorList,
    ...LogicalOperatorList,
    ...NullCoalescingOperatorList,
    ...AssignmentOperatorList
] as const;

export const OperatorList = [
    ...NewOperatorList,
    ...DeleteOperatorList,
    ...MemberAccessOperatorList,
    ...FunctionCallOperatorList,
    ...PostfixOperatorList,
    ...TypeCastOperatorList,
    ...UnaryOperatorList,
    ...BinaryOperatorList,
    ...TernaryOperatorList
] as const;
