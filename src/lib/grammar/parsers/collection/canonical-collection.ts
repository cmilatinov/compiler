import { Grammar } from '../../grammar';
import { LRItem } from '../items';
import { GraphState } from './graph';

export class CanonicalCollection<T extends LRItem> {
    public readonly states: GraphState<T>[];

    constructor(states: GraphState<T>[]) {
        this.states = states;
    }

    public contains(state: GraphState<T>): boolean {
        return !!this.states.find((s) => s.equals(state));
    }

    public toString(): string {
        let str = 'digraph {\n    rankdir=LR;\n';
        str += '\n';
        this.states.forEach(
            (s, i) =>
                (str += `    n${i} [label="${s
                    .toString()
                    .replaceAll('\n', '\\n')}", shape=circle];\n`)
        );
        str += '\n';
        this.states.forEach((s, i) =>
            Object.keys(s.transitions).forEach(
                (t) =>
                    (str += `    n${i} -> n${this.states.indexOf(
                        s.transitions[t]
                    )} [label="${Grammar.stringify(t)}"];\n`)
            )
        );
        str += '}';
        return str;
    }
}
