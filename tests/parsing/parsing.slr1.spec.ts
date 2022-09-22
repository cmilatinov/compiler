import { createParsingTest } from './parsing.utils';
import { GrammarParserSLR1 } from '../../src/lib/grammar/parsers/grammar-parser-slr';

createParsingTest('SLR(1)', GrammarParserSLR1);
