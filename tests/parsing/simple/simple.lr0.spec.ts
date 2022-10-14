import { createSimpleParsingTest } from './simple.utils';
import { GrammarParserLR0 } from '../../../src/lib/grammar/parsers';

createSimpleParsingTest('LR(0)', GrammarParserLR0);
