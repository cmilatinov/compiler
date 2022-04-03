import commandLineArgs from 'command-line-args';
import * as fs from 'fs';

import { GrammarFactory } from '../lib/grammar';
import DefaultGrammar from '../lib/default-grammar';
import { commandLineOptions, printHelp } from './cli';
import { DefaultValidator } from '../semantic-analyzer/default-validator';
import { CodeGenerator } from './code-generator';

function main() {

    // Get cmd args
    const options = commandLineArgs(commandLineOptions);

    // Print help
    if (options.help) {
        return printHelp();
    }

    // No input specified
    if (!options.input && !options['inline-input']) {
        console.log('[ERROR]: No input file or string specified!\n');
        console.log(`Refer to 'compilerdriver --help' for usage description and examples.`);
        return;
    }

    // Grammar
    const grammar = GrammarFactory.fromString(DefaultGrammar);

    // Open error file
    const outputErrorFilePath = options.input?.replace(/\.[^/.]+$/, '.outerrors') || '.outerrors';
    const outputErrorFile = fs.openSync(outputErrorFilePath, 'w');
    if (!outputErrorFile) {
        console.log(`[ERROR]: Unable to open error output file (${options.error}) for writing!\n`);
        console.log('Ensure that the file is not being used by another process.');
        return;
    }

    // Parsing
    const printErr = str => {
        const error = `[ERROR]: ${str}\n`;
        process.stdout.write(error);
        fs.writeSync(outputErrorFile, error);
    };
    const derivation = options.input ? grammar.parseFile(options.input, printErr) : grammar.parseString(options['inline-input'], printErr);
    if (!derivation) {
        console.log(`\n[ERROR]: The input source file or string contains one or more syntax errors.\n`);
        console.log('Modify the source code to fix the aforementioned syntax errors and attempt to validate it again.');
        return;
    }

    // Open output file
    const outputFilePath = options.output || options.input?.replace(/\.[^/.]+$/, '.moon') || '.moon';
    const outputFile = fs.openSync(outputFilePath, 'w');
    if (!outputFile) {
        console.log(`[ERROR]: Unable to open output file (${outputFilePath}) for writing!\n`);
        console.log('Ensure that the file is not being used by another process.');
        return;
    }

    // Generate AST
    const ast = grammar.createAST(derivation);

    // Validate AST
    const printWarning = str => {
        const error = `[WARNING]: ${str}\n`;
        process.stdout.write(error);
        fs.writeSync(outputErrorFile, error);
    };
    const validator = new DefaultValidator(printWarning, printErr);
    if (!validator.validate(ast))  {
        console.log(`\n[ERROR]: The input source file or string contains one or more semantic errors.\n`);
        console.log('Modify the source code to fix the aforementioned semantic errors and attempt to validate it again.');
        return;
    }

    // Generate code to output file
    const codeGenerator = new CodeGenerator(ast, validator.getGlobalSymbolTable(), str => fs.writeSync(outputFile, str));
    codeGenerator.traverse(ast);

    // Close files
    fs.closeSync(outputFile);
    fs.closeSync(outputErrorFile);

}

main();
