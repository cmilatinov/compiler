import { createSimpleParsingTest } from './simple.utils';
import { GrammarParserLR1 } from '../../../src/lib/grammar/parsers';

createSimpleParsingTest('LR(1)', GrammarParserLR1);
