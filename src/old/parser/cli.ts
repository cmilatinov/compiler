import commandLineUsage, { OptionDefinition } from 'command-line-usage';

export const commandLineOptions: OptionDefinition[] = [
    {
        name: 'input',
        defaultOption: true,
        typeLabel: '{underline file}',
        description: 'An input text file or string to parse.'
    },
    {
        name: 'output',
        alias: 'o',
        defaultValue: '.outderivation',
        type: String,
        typeLabel: '{underline file}',
        description: `An output file (.outderivation) to which to print the derivation of the input. Defaults to './.outderivation'.`
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
        defaultValue: '.outsyntaxerrors',
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
            header: 'Parser',
            content: 'Generates a parsing derivation of an input using the provided grammar.'
        },
        {
            header: 'Usage',
            content: [
                { desc: 'Parsing', example: '$ parserdriver {underline input} [options ...]' },
                { desc: 'Print Default Grammar', example: '$ parserdriver --default-grammar' },
                { desc: 'Print Help', example: '$ parserdriver --help' }
            ]
        },
        {
            header: 'Examples',
            content: [
                '$ parserdriver bubblesort.src',
                '$ parserdriver polynomial.src -o polynomial.outderivation',
                '$ parserdriver simple.src -e simple.outsyntaxerrors',
                '$ parserdriver -i "func main() -> void \\{ return (0); \\}" -o main.outderivation'
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
