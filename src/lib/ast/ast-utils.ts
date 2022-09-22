import { ASTNode } from './ast-node';

export function printAST(
    node: ASTNode,
    print: (str) => void = (str) => process.stdout.write(str),
    indent: string = '',
    last: number = 2
) {
    if (!node || !node.type) return;

    // Print indent
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

    // Print node
    let properties = Object.entries(node)
        .filter(
            ([k, v]) =>
                k !== 'type' &&
                (typeof v === 'number' ||
                    typeof v === 'string' ||
                    (Array.isArray(v) && v.length > 0 && typeof v[0] !== 'object'))
        )
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : `'${v}'`}`)
        .join(', ');
    if (properties !== '') properties = `{ ${properties} }`;
    print(`[${node.type}] ${properties ? '— ' : ''}${properties}\n`);

    // Find children
    const children = getNodeChildren(node);

    // Print each child node
    for (let i = 0; i < children.length; i++) {
        printAST(children[i], print, indent, i == children.length - 1 ? 1 : 0);
    }
}

export function getNodeChildren(node: ASTNode): ASTNode[] {
    return Object.values(node)
        .filter((value) => {
            if (
                Array.isArray(value) &&
                value.length > 0 &&
                typeof value[0] === 'object' &&
                value[0] &&
                value[0].hasOwnProperty('type')
            )
                return true;
            else if (value && typeof value === 'object' && value.hasOwnProperty('type'))
                return true;
            return false;
        })
        .reduce<ASTNode[]>(
            (accumulator, value) =>
                Array.isArray(value) ? [...accumulator, ...value] : [...accumulator, value],
            []
        );
}
