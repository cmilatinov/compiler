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
        description: `An output file (.moon) to which to print the symbol tables associated with the input source.`
    },
    {
        name: 'error',
        alias: 'e',
        type: String,
        typeLabel: '{underline file} [optional]',
        description: `An output error file (.outerrors) to which to print any syntax semantic errors and warnings encountered.`
    },
    {
        name: 'inline-input',
        alias: 'i',
        type: String,
        typeLabel: '{underline string} [optional]',
        description:
            'Provide an inline string input instead of a file to analyze. If using this option, the {underline input} option may be omitted.'
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
            header: 'Compiler',
            content:
                'Generates MOON assembly instructions corresponding to the provided source file.'
        },
        {
            header: 'Usage',
            content: [
                { desc: 'Analysis', example: '$ compilerdriver {underline input} [options ...]' },
                { desc: 'Print Help', example: '$ compilerdriver --help' }
            ]
        },
        {
            header: 'Examples',
            content: [
                '$ compilerdriver bubblesort.src',
                '$ compilerdriver polynomial.src -o polynomial.moon',
                '$ compilerdriver simple.src -e simple.outerrors',
                '$ compilerdriver -i "func main() -> void \\{ return (0); \\}" -o main.moon'
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
