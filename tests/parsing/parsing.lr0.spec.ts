import { createParsingTest } from './parsing.utils';
import { GrammarParserLR0 } from '../../src/lib/grammar/parsers/grammar-parser-lr0';

createParsingTest('LR(0)', GrammarParserLR0);
