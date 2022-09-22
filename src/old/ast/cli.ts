import commandLineUsage, { OptionDefinition } from 'command-line-usage';

export const commandLineOptions: OptionDefinition[] = [
    {
        name: 'input',
        defaultOption: true,
        typeLabel: '{underline file}',
        description: 'An input text file to parse.'
    },
    {
        name: 'output',
        alias: 'o',
        type: String,
        typeLabel: '{underline file}',
        description: `An output file (.outast) to which to print an AST representing the input file. Defaults to './.outast'.`
    },
    {
        name: 'grammar',
        alias: 'g',
        type: String,
        typeLabel: '{underline file}',
        description:
            'An input grammar file (.grm) containing the grammar definition to use during parsing. If not specified, the default grammar will be used.'
    },
    {
        name: 'default-grammar',
        type: Boolean,
        typeLabel: '',
        description: 'Use this option to print the default grammar used for parsing source files.'
    },
    {
        name: 'error',
        alias: 'e',
        type: String,
        typeLabel: '{underline file}',
        description: `An output error file (.outsyntaxerrors) to which to print any syntax errors encountered. Defaults to './.outsyntaxerrors'.`
    },
    {
        name: 'inline-input',
        alias: 'i',
        type: String,
        typeLabel: '{underline string}',
        description:
            'Provide an inline string input instead of a file to parse. If using this option, the {underline input} option may be omitted.'
    },
    {
        name: 'parse-table',
        typeLabel: '{underline file}',
        description: `An output file (.outparsetable) to which to output the grammar's LL(1) parse table. If the file name is omitted, the parse table will be outputted to './.outparsetable'.`
    },
    {
        name: 'help',
        type: Boolean,
        typeLabel: '',
        description: 'Displays this help dialog in the console.'
    }
];

export function printHelp() {
    const sections = [
        {
            header: 'AST Generator',
            content:
                'Generates an Abstract Syntax Tree from the given input using the provided grammar.'
        },
        {
            header: 'Usage',
            content: [
                { desc: 'AST Generation', example: '$ astdriver {underline input} [options ...]' },
                { desc: 'Print Default Grammar', example: '$ astdriver --default-grammar' },
                { desc: 'Print Help', example: '$ astdriver --help' }
            ]
        },
        {
            header: 'Examples',
            content: [
                '$ astdriver bubblesort.src',
                '$ astdriver polynomial.src -o polynomial.outast',
                '$ astdriver simple.src -e simple.outsyntaxerrors',
                '$ astdriver -i "func main() -> void \\{ return (0); \\}" -o main.outast'
            ]
        },
        {
            header: 'Options',
            optionList: commandLineOptions
        }
    ];
    const usage = commandLineUsage(sections);
    console.log(usage);
}
