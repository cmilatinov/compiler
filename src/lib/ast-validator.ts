export interface ASTNode {
    type: string,
    [key: string]: any,
}

export type EventCallback = (string) => void;

export const defaultWarning = str => console.log(`[WARNING]: ${str}`);
export const defaultError = str => console.log(`[ERROR]: ${str}`);

export abstract class ASTValidatorBase {

    protected readonly _warning: EventCallback;
    protected readonly _error: EventCallback;

    protected constructor(warning: EventCallback = defaultWarning, error: EventCallback = defaultError) {
        this._warning = warning;
        this._error = error;
    }

    public validate(ast: ASTNode): boolean {
        let valid = this.visit(ast);
        if (!valid)
            return false;
        const childrenValid = this.getChildren(ast).map(c => this.validate(c));
        valid = this.postVisit(ast);
        return valid && childrenValid.every(v => v);
    }

    protected abstract visit(node: ASTNode): boolean;

    protected abstract postVisit(node: ASTNode): boolean;

    protected abstract getChildren(node: ASTNode): ASTNode[];

}

