import { BaseTypeSpecifier, FunctionTypeSpecifier } from '../type/type-specifier';
import { Operator } from './operators';
import { BaseException } from '../../lib/exceptions';
import { Address, CodeGeneratorASM } from '../../lib/code-generator';
import { type } from 'os';

export interface FunctionArgument {
    type: BaseTypeSpecifier;
    address: Address;
    identifier: string;
}

export type OperatorImplementation = (
    generator: CodeGeneratorASM,
    returnValue: FunctionArgument,
    ...args: FunctionArgument[]
) => void;

export interface OperatorDefinition {
    readonly type: FunctionTypeSpecifier;
    readonly implementation?: OperatorImplementation;
}

export class EmptyOperatorDefinition implements OperatorDefinition {
    constructor(public readonly type: FunctionTypeSpecifier) {}
}

export class BasicOperatorDefinition implements OperatorDefinition {
    constructor(
        public readonly type: FunctionTypeSpecifier,
        public readonly implementation: OperatorImplementation
    ) {}
}

export type OperatorDefinitionRule = (
    options: any,
    typeList: BaseTypeSpecifier[]
) => OperatorDefinition[] | BaseException;

interface OperatorDefinitions {
    [key: string]: OperatorDefinition[];
}

interface OperatorDefinitionRules {
    [key: string]: OperatorDefinitionRule[];
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
                d.type.hasArity(definition.type.parameters.length) &&
                d.type.parameters.every((p, i) => p.equals(definition.type.parameters[i]))
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
        if (!this._opDefinitionRules[operator]) {
            this._opDefinitionRules[operator] = [];
        }
        this._opDefinitionRules[operator].push(rule);
        return true;
    }

    public getCandidateDefinitions(
        operator: Operator,
        options: any,
        typeList: BaseTypeSpecifier[],
        exact: boolean = false
    ) {
        const definitions = (this._opDefinitions[operator] || []).filter(
            (d) =>
                (d.type.hasArity(typeList.length) &&
                    !exact &&
                    (d.type.hasArity(1) ||
                        d.type.parameters.some((p, i) => p.equals(typeList[i])))) ||
                (exact && d.type.parameters.every((p, i) => p.equals(typeList[i])))
        );

        const ruleDefs = (this._opDefinitionRules[operator] || []).reduce((acc, rule) => {
            const result = rule(options, typeList);
            if (Array.isArray(result)) return [...acc, ...result];
            return [...acc, result];
        }, []);
        const ruleDefsFiltered = ruleDefs.filter((d) => !(d instanceof BaseException));
        if (ruleDefsFiltered.length <= 0 && definitions.length <= 0) {
            const exception = ruleDefs.find((d) => d instanceof BaseException);
            if (exception) throw exception;
            return [];
        }

        return definitions.concat(ruleDefsFiltered.filter((d) => d.type.hasArity(typeList.length)));
    }
}
