import { createParsingTest } from './parsing.utils';
import { GrammarParserLL1 } from '../../src/lib/grammar/parsers/grammar-parser-ll1';

createParsingTest('LL(1)', GrammarParserLL1);
