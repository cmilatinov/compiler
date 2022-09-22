export const NewOp = 'new' as const;
export const NewArrayOp = 'new[]' as const;
export const NewOperatorList = [NewOp, NewArrayOp] as const;
export type NewOperator = typeof NewOperatorList[number];

export const DeleteOp = 'delete' as const;
export const DeleteArrayOp = 'delete[]' as const;
export const DeleteOperatorList = [DeleteOp, DeleteArrayOp] as const;
export type DeleteOperator = typeof DeleteOperatorList[number];

export const MemberAccessOp = '.' as const;
export const MemberAccessDereferenceOp = '->' as const;
export const MemberAccessOperatorList = [MemberAccessOp, MemberAccessDereferenceOp] as const;
export type MemberAccessOperator = typeof MemberAccessOperatorList[number];

export const FunctionCallOp = '()' as const;
export const FunctionCallOperatorList = [FunctionCallOp] as const;
export type FunctionCallOperator = typeof FunctionCallOperatorList[number];

export const IncrementOp = '++' as const;
export const DecrementOp = '--' as const;
export const PostfixOperatorList = [IncrementOp, DecrementOp] as const;
export type PostfixOperator = typeof PostfixOperatorList[number];

export const TypecastOp = 'type()' as const;
export const TypeCastOperatorList = [TypecastOp] as const;
export type TypeCastOperator = typeof TypeCastOperatorList[number];

export const IndexOp = '[]' as const;
export const IndexOperatorList = [IndexOp] as const;
export type IndexOperator = typeof IndexOperatorList[number];

export const AdditionOp = '+' as const;
export const SubtractionOp = '-' as const;
export const LogicalNotOp = '!' as const;
export const BitwiseNotOp = '~' as const;
export const AddressOfOp = '&' as const;
export const DereferenceOp = '*' as const;
export const UnaryOperatorList = [
    IncrementOp,
    DecrementOp,
    AdditionOp,
    SubtractionOp,
    LogicalNotOp,
    BitwiseNotOp,
    AddressOfOp,
    DereferenceOp
] as const;
export type UnaryOperator = typeof UnaryOperatorList[number];

export const PowerOp = '^^' as const;
export const PowerOperatorList = [PowerOp] as const;
export type PowerOperator = typeof PowerOperatorList[number];

export const MultiplicationOp = '*' as const;
export const DivisionOp = '/' as const;
export const RemainderOp = '%' as const;
export const MultiplicativeOperatorList = [MultiplicationOp, DivisionOp, RemainderOp] as const;
export type MultiplicativeOperator = typeof MultiplicativeOperatorList[number];

export const AdditiveOperatorList = [AdditionOp, SubtractionOp] as const;
export type AdditiveOperator = typeof AdditiveOperatorList[number];

export const LeftShiftOp = '<<' as const;
export const RightShiftOp = '>>' as const;
export const ShiftOperatorList = [LeftShiftOp, RightShiftOp] as const;
export type ShiftOperator = typeof ShiftOperatorList[number];

export const LessThanEqualOp = '<=' as const;
export const GreaterThanEqualOp = '>=' as const;
export const LessThanOp = '<' as const;
export const GreaterThanOp = '>' as const;
export const RelationalOperatorList = [
    LessThanEqualOp,
    GreaterThanEqualOp,
    LessThanOp,
    GreaterThanOp
] as const;
export type RelationalOperator = typeof RelationalOperatorList[number];

export const EqualOp = '==' as const;
export const NotEqualOp = '!=' as const;
export const EqualityOperatorList = [EqualOp, NotEqualOp] as const;
export type EqualityOperator = typeof EqualityOperatorList[number];

export const BitwiseAndOp = '&' as const;
export const BitwiseOrOp = '|' as const;
export const BitwiseXorOp = '^' as const;
export const BitwiseOperatorList = [BitwiseAndOp, BitwiseOrOp, BitwiseXorOp] as const;
export type BitwiseOperator = typeof BitwiseOperatorList[number];

export const LogicalAndOp = '&&' as const;
export const LogicalOrOp = '||' as const;
export const LogicalOperatorList = [LogicalAndOp, LogicalOrOp] as const;
export type LogicalOperator = typeof LogicalOperatorList[number];

export const NullCoalescingOp = '??' as const;
export const NullCoalescingOperatorList = [NullCoalescingOp] as const;
export type NullCoalescingOperator = typeof NullCoalescingOperatorList[number];

export const TernaryOp = '?:' as const;
export const TernaryOperatorList = [TernaryOp] as const;
export type TernaryOperator = typeof TernaryOperatorList[number];

export const NullCoalescingAssignmentOp = '??=' as const;
export const LeftShiftAssignmentOp = '<<=' as const;
export const RightShiftAssignmentOp = '>>=' as const;
export const BitwiseAndAssignmentOp = '&=' as const;
export const BitwiseOrAssignmentOp = '|=' as const;
export const BitwiseXorAssignmentOp = '^=' as const;
export const MultiplicationAssignmentOp = '*=' as const;
export const DivisionAssignmentOp = '/=' as const;
export const RemainderAssignmentOp = '%=' as const;
export const AdditionAssignmentOp = '+=' as const;
export const SubtractionAssignmentOp = '-=' as const;
export const AssignmentOp = '=' as const;
export const AssignmentOperatorList = [
    NullCoalescingAssignmentOp,
    LeftShiftAssignmentOp,
    RightShiftAssignmentOp,
    BitwiseAndAssignmentOp,
    BitwiseOrAssignmentOp,
    BitwiseXorAssignmentOp,
    MultiplicationAssignmentOp,
    DivisionAssignmentOp,
    RemainderAssignmentOp,
    AdditionAssignmentOp,
    SubtractionAssignmentOp,
    AssignmentOp
] as const;
export type AssignmentOperator = typeof AssignmentOperatorList[number];

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
export type BinaryOperator = typeof BinaryOperatorList[number];

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
export type Operator = typeof OperatorList[number];

export const StringLiteralType = 'StringLiteral' as const;
export const FloatLiteralType = 'FloatLiteral' as const;
export const IntLiteralType = 'IntLiteral' as const;
export const BooleanLiteralType = 'BooleanLiteral' as const;
export const NullLiteralType = 'NullLiteral' as const;
export const ThisLiteralType = 'ThisLiteral' as const;
export const LiteralList = [
    StringLiteralType,
    FloatLiteralType,
    IntLiteralType,
    BooleanLiteralType,
    NullLiteralType,
    ThisLiteralType
] as const;
export type Literal = typeof LiteralList[number];
