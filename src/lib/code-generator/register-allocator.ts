export class RegisterAllocator {
    protected readonly _registers: string[];
    protected readonly _registerList: { name: string; used: boolean }[];

    constructor(registers: string[]) {
        this._registers = registers;
        this._registerList = this._registers.map((name) => ({ name, used: false }));
    }

    public allocate(): string | null {
        const register = this._registerList.find((r) => !r.used);
        if (!register) {
            return null;
        }

        register.used = true;
        return register.name;
    }

    public free(registerName: string) {
        const register = this._registerList.find((r) => r.name === registerName);
        if (register) {
            register.used = false;
        }
    }
}
