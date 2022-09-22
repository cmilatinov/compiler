import { ASTValidationPipeline } from '../lib/ast/ast-validation-pipeline';
import { SymbolTableGenerator } from './symbol-table/symbol-table-generator';
import { TypeChecker } from './type/type-checker';

export class SCLangPipeline extends ASTValidationPipeline {
    constructor() {
        super(SymbolTableGenerator, TypeChecker);
    }
}
