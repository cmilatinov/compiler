import { createSimpleParsingTest } from './simple.utils';
import { GrammarParserSLR1 } from '../../../src/lib/grammar/parsers';

createSimpleParsingTest('SLR(1)', GrammarParserSLR1);
