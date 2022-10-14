import { createSimpleParsingTest } from './simple.utils';
import { GrammarParserLL1 } from '../../../src/lib/grammar/parsers';

createSimpleParsingTest('LL(1)', GrammarParserLL1);
