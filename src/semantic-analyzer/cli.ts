import commandLineUsage, { OptionDefinition } from 'command-line-usage';

export const commandLineOptions: OptionDefinition[] = [
    {
        name: 'input',
        defaultOption: true,
        typeLabel: '{underline file}',
        description: 'An input source file to analyze.'
    },
    {
        name: 'output',
        alias: 'o',
        type: String,
        typeLabel: '{underline file} [optional]',
        description: `An output file (.outsymboltables) to which to print the symbol tables associated with the input source.`
    },
    {
        name: 'error',
        alias: 'e',
        type: String,
        typeLabel: '{underline file} [optional]',
        description: `An output error file (.outsemanticerrors) to which to print any syntax semantic errors and warnings encountered.`
    },
    {
        name: 'inline-input',
        alias: 'i',
        type: String,
        typeLabel: '{underline string} [optional]',
        description: 'Provide an inline string input instead of a file to analyze. If using this option, the {underline input} option may be omitted.'
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
            header: 'Semantic Analyzer',
            content: 'Verifies that the provided source file is semantically correct and generates its corresponding symbol tables.'
        },
        {
            header: 'Usage',
            content: [
                { desc: 'Analysis', example: '$ semanticanalyzerdriver {underline input} [options ...]' },
                { desc: 'Print Help', example: '$ semanticanalyzerdriver --help' }
            ]
        },
        {
            header: 'Examples',
            content: [
                '$ semanticanalyzerdriver bubblesort.src',
                '$ semanticanalyzerdriver polynomial.src -o polynomial.outsymboltables',
                '$ semanticanalyzerdriver simple.src -e simple.outsemanticerrors',
                '$ semanticanalyzerdriver -i "func main() -> void \\{ return (0); \\}" -o main.outsymboltables'
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
