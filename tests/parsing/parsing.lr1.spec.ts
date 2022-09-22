import { createParsingTest } from './parsing.utils';
import { GrammarParserLR1 } from '../../src/lib/grammar/parsers/grammar-parser-lr1';

createParsingTest('LR(1)', GrammarParserLR1);
