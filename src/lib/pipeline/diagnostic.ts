import colors from 'colors';
import _ from 'lodash';

import { SourceLocation } from '../tokenizer';

export enum DiagnosticType {
    NOTE = 'note',
    WARNING = 'warning',
    ERROR = 'error'
}

export interface Diagnostic {
    type: DiagnosticType;
    location?: SourceLocation;
    message: string;
}

export type DiagnosticCallback = (diagnostic: Diagnostic) => void;

export const IGNORE_DIAGNOSTICS = (_: Diagnostic) => {};

export const PRINT_DIAGNOSTICS = (diagnostic: Diagnostic) => {
    const locationStr = diagnostic.location?.toString().underline;
    const diagnosticColors = {
        [DiagnosticType.NOTE]: 'blue',
        [DiagnosticType.WARNING]: 'yellow',
        [DiagnosticType.ERROR]: 'red'
    };
    console.log(
        `${colors.bold(`[${_.upperCase(diagnostic.type)}]`)}${
            locationStr ? ` ${locationStr}` : ''
        } ${diagnostic.message}`[diagnosticColors[diagnostic.type]]
    );
};

export class DiagnosticProducer {
    protected _diagnosticCallback: DiagnosticCallback = PRINT_DIAGNOSTICS;

    set diagnosticCallback(value: DiagnosticCallback) {
        this._diagnosticCallback = value;
    }

    protected error(message: string, location?: SourceLocation) {
        this._diagnosticCallback?.({
            type: DiagnosticType.ERROR,
            location,
            message
        });
    }

    protected warning(message: string, location?: SourceLocation) {
        this._diagnosticCallback?.({
            type: DiagnosticType.WARNING,
            location,
            message
        });
    }

    protected note(message: string, location?: SourceLocation) {
        this._diagnosticCallback?.({
            type: DiagnosticType.NOTE,
            location,
            message
        });
    }
}
