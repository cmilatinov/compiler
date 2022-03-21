import commandLineArgs from 'command-line-args';
import * as fs from 'fs';

import { commandLineOptions, printHelp } from './cli';
import { Grammar, GrammarFactory } from '../lib/grammar';
import DefaultGrammar from '../lib/default-grammar';
import * as Utils from './utils';

main();

function main() {

    // Get cmd args
    const options = commandLineArgs(commandLineOptions);

    // Print help
    if (options.help) {
        return printHelp();
    }

    // Print default grammar
    if (options['default-grammar']) {
        const grammar = GrammarFactory.fromString(DefaultGrammar);
        grammar.print();
        return;
    }

    // No input specified
    if (!options.input && !options['inline-input']) {
        console.log('[ERROR]: No input file or string specified!\n');
        console.log(`Refer to 'parserdriver --help' for usage description and examples.`);
        return;
    }

    // Grammar
    const grammar: Grammar = options.grammar ? GrammarFactory.fromFile(options.grammar) : GrammarFactory.fromString(DefaultGrammar);

    // Check LL(1)
    if (!grammar.isLL1()) {
        console.log('[ERROR]: Given grammar is not LL(1)!\n');
        console.log('Ensure that the supplied grammar is in LL(1) form, without any left recursions or ambiguities.');
        return;
    }

    // Open error file
    const outputErrorFilePath = options.input?.replace(/\.[^/.]+$/, '.outsyntaxerrors') || '.outsyntaxerrors';
    const outputErrorFile = fs.openSync(outputErrorFilePath, 'w');
    if (!outputErrorFile) {
        console.log(`[ERROR]: Unable to open error output file (${options.error}) for writing!\n`);
        console.log('Ensure that the file is not being used by another process.');
        return;
    }

    // Parsing
    const printErr = str => {
        process.stdout.write(str);
        fs.writeSync(outputErrorFile, str);
    };
    const root = options.input ? grammar.parseFile(options.input, printErr) : grammar.parseString(options['inline-input'], printErr);

    // Print parse table
    if (options['parse-table'] !== undefined) {
        const outputTableFile = fs.openSync(options['parse-table'] || '.outparsetable', 'w');
        if (!outputTableFile) {
            console.log('[ERROR]: Unable to open output parse table file for writing!\n');
            console.log('Ensure that the file is not being used by another process.');
            return;
        }
        grammar.printParseTable(str => fs.writeSync(outputTableFile, str));
        fs.closeSync(outputTableFile);
    }

    // Open output file
    const outputFilePath = options.output || options.input?.replace(/\.[^/.]+$/, '.outast') || '.outast';
    const outputFile = fs.openSync(outputFilePath, 'w');
    if (!outputFile) {
        console.log(`[ERROR]: Unable to open output file (${outputFilePath}) for writing!\n`);
        console.log('Ensure that the file is not being used by another process.');
        return;
    }

    // Generate & Print AST
    const ast = grammar.createAST(root);
    Utils.printAST(ast, str => fs.writeSync(outputFile, str));

    // Close files
    fs.closeSync(outputFile);
    fs.closeSync(outputErrorFile);

}
