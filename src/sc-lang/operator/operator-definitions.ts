import { BaseTypeSpecifier, FunctionTypeSpecifier } from '../type/type-specifier';
import { Operator } from './operators';
import { BaseException } from '../../lib/exceptions';

export type OperatorDefinition = FunctionTypeSpecifier;

export type OperatorDefinitionRule = (
    options: any,
    typeList: BaseTypeSpecifier[]
) => FunctionTypeSpecifier[] | BaseException;

interface OperatorDefinitions {
    [key: string]: OperatorDefinition[];
}

interface OperatorDefinitionRules {
    [key: string]: OperatorDefinitionRule;
}

export class OperatorDefinitionTable {
    private readonly _opDefinitions: OperatorDefinitions;
    private readonly _opDefinitionRules: OperatorDefinitionRules;

    constructor() {
        this._opDefinitions = {};
        this._opDefinitionRules = {};
    }

    public addDefinitionMultiple(operators: Operator[], definitions: OperatorDefinition[]) {
        return operators.every((op) => definitions.every((d) => this.addDefinition(op, d)));
    }

    public addDefinition(operator: Operator, definition: OperatorDefinition) {
        if (!this._opDefinitions[operator]) {
            this._opDefinitions[operator] = [];
        }
        const existingDef = this._opDefinitions[operator].find(
            (d) =>
                d.hasArity(definition.parameters.length) &&
                d.parameters.every((p, i) => p.equals(definition.parameters[i]))
        );
        if (existingDef) {
            return false;
        }
        this._opDefinitions[operator].push(definition);
        return true;
    }

    public addDefinitionRuleMultiple(operators: Operator[], rule: OperatorDefinitionRule) {
        return operators.every((op) => this.addDefinitionRule(op, rule));
    }

    public addDefinitionRule(operator: Operator, rule: OperatorDefinitionRule) {
        if (this._opDefinitionRules[operator]) return false;
        this._opDefinitionRules[operator] = rule;
        return true;
    }

    public getCandidateDefinitions(
        operator: Operator,
        options: any,
        typeList: BaseTypeSpecifier[]
    ) {
        const definitions = (this._opDefinitions[operator] || []).filter(
            (d) =>
                d.parameters.length === typeList.length &&
                d.parameters.some((p, i) => p.equals(typeList[i]))
        );

        const ruleDefs = this._opDefinitionRules[operator]
            ? this._opDefinitionRules[operator](options, typeList)
            : [];
        if (!(ruleDefs instanceof BaseException)) {
            definitions.push(...ruleDefs.filter((f) => f.hasArity(typeList.length)));
        }

        if (definitions.length <= 0 && ruleDefs instanceof BaseException) {
            throw ruleDefs;
        }

        return definitions;
    }
}
