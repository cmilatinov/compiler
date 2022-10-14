export enum Instruction {
    ENDBR64 = 'endbr64',
    PUSH = 'push',
    POP = 'pop',
    MOV = 'mov',
    NOT = 'not',
    AND = 'and',
    OR = 'or',
    XOR = 'xor',
    ADD = 'add',
    SUB = 'sub',
    INC = 'inc',
    DEC = 'dec',
    NEG = 'neg',
    CMP = 'cmp',
    RET = 'ret',

    SETE = 'sete',
    SETNE = 'setne',
    ADDSD = 'addsd',
    CVTSI2SD = 'cvtsi2sd'
}
