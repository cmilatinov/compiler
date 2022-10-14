import '../sc-lang/type/type-specifier';
import { SCLangPipeline } from '../sc-lang/sc-lang-pipeline';
import { PRINT_DIAGNOSTICS } from '../lib/pipeline';
import { SymbolTable } from '../lib/symbol-table';
import { ASTNode } from '../lib/ast/ast-node';

main();

function main() {
    const pipeline = new SCLangPipeline();
    pipeline.diagnosticCallback = PRINT_DIAGNOSTICS;
    const output: { ast: ASTNode; symbolTable: SymbolTable } = pipeline.execute(
        `
        def sqrt(x: int, y: int) -> int {
            return x;
        }
        
        def main() -> int {
            let a = 2 * 3 + 4;
            let b = 2;
            let c = 1;
            let x = (-b + sqrt(b ^^ 2 - 4 * a * c, 0)) / (2 * a);
            return a + 3;
        }
        `
    );
    if (output) {
        console.log();
        console.log(output);
        console.log();
    }
}
