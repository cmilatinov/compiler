export enum InstructionX64 {
    PUSH = 'push',
    POP = 'pop',
    MOV = 'mov',
    NOT = 'not',
    AND = 'and',
    OR = 'or',
    XOR = 'xor',
    ADD = 'add',
    SUB = 'sub',
    IMUL = 'imul',
    IDIV = 'idiv',
    INC = 'inc',
    DEC = 'dec',
    NEG = 'neg',
    CMP = 'cmp',
    RET = 'ret',
    JMP = 'jmp',
    SHL = 'shl',
    SHR = 'shr',

    SETE = 'sete',
    SETNE = 'setne',
    ADDSD = 'addsd',
    CVTSI2SD = 'cvtsi2sd'
}
