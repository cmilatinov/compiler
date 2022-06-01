import * as fs from 'fs';
import commandLineArgs from 'command-line-args';

import { commandLineOptions, printHelp } from './cli';
import { Grammar, GrammarFactory } from '../lib/grammar/grammar';
import DefaultGrammar from '../lib/default-grammar';
import { GrammarParser } from '../lib/grammar/grammar-parser';
import { GrammarParserLL1 } from '../lib/grammar/parsers/grammar-parser-ll1';

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
    const grammarParser = new GrammarParserLL1(grammar);

    // Check LL(1)
    if (!grammarParser.isLL1()) {
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
    const root = options.input ? grammarParser.parseFile(options.input, printErr) : grammarParser.parseString(options['inline-input'], printErr);

    // Print parse table
    if (options['parse-table'] !== undefined) {
        const outputTableFile = fs.openSync(options['parse-table'] || '.outparsetable', 'w');
        if (!outputTableFile) {
            console.log('[ERROR]: Unable to open output parse table file for writing!\n');
            console.log('Ensure that the file is not being used by another process.');
            return;
        }
        grammarParser.printParseTable(str => fs.writeSync(outputTableFile, str));
        fs.closeSync(outputTableFile);
    }

    // Open output file
    const outputFilePath = options.output || options.input?.replace(/\.[^/.]+$/, '.outderivation') || '.outderivation';
    const outputFile = fs.openSync(outputFilePath, 'w');
    if (!outputFile) {
        console.log(`[ERROR]: Unable to open output file (${outputFilePath}) for writing!\n`);
        console.log('Ensure that the file is not being used by another process.');
        return;
    }

    // Print derivation
    GrammarParser.printDerivationTree(root, str => fs.writeSync(outputFile, str));

    // Close files
    fs.closeSync(outputFile);
    fs.closeSync(outputErrorFile);
}

