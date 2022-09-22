import { DEFAULT_PROCESSOR, StringProcessor } from '../string-processor';
import { DerivationNode } from './grammar-parser';

export function printDerivationTree(
    node: DerivationNode,
    print: StringProcessor = DEFAULT_PROCESSOR,
    indent = '',
    last = 2
) {
    if (node === null) return;

    print(indent);

    switch (last) {
        case 0:
            print('├───');
            indent += '│   ';
            break;
        case 1:
            print('└───');
            indent += '    ';
            break;
    }

    print(node.toString());
    print('\n');

    for (let i = 0; i < node.children.length; i++) {
        printDerivationTree(node.children[i], print, indent, i == node.children.length - 1 ? 1 : 0);
    }
}
