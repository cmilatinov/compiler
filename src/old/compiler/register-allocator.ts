export interface Register {
    id: number;
    name: string;
    used: boolean;
}

const registers: string[] = [
    'R1',
    'R2',
    'R3',
    'R4',
    'R5',
    'R6',
    'R7',
    'R8',
    'R9',
    'R10',
    'R11',
    'R12'
];

export class RegisterAllocator {
    private _registers: Register[];

    public static readonly RET: Register = { id: 12, name: 'R13', used: true };
    public static readonly RBP: Register = { id: 13, name: 'R14', used: true };
    public static readonly RSP: Register = { id: 14, name: 'R15', used: true };

    constructor() {
        this._registers = registers.map((r, i) => ({ id: i, name: r, used: false }));
    }

    allocateRegister(): Register {
        const register = this._registers.find((r) => !r.used);
        if (!register) {
            throw new Error(`Insufficient amount of registers.`);
        }

        register.used = true;
        return register;
    }

    freeRegister(registerID: number) {
        const register = this._registers.find((r) => r.id === registerID);
        if (!register) {
        }

        register.used = false;
    }
}

