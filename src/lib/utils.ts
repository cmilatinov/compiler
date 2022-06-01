import { Transform } from 'stream';
import { Console } from 'console';
import { table, TableUserConfig } from 'table';
import 'colors';

export function stringTable(tableObject) {
    const ts = new Transform({
        transform(chunk, enc, cb) {
            cb(null, chunk)
        }
    });
    const logger = new Console({stdout: ts});
    logger.table(tableObject);
    return (ts.read() || '').toString();
}

export function stringTableFormatted(tableObject: any[], config?: TableUserConfig) {
    return table(tableObject, {
        border: {
            headerJoin: `┬`.grey,

            topBody: `─`.grey,
            topJoin: `┬`.grey,
            topLeft: `┌`.grey,
            topRight: `┐`.grey,

            bottomBody: `─`.grey,
            bottomJoin: `┴`.grey,
            bottomLeft: `└`.grey,
            bottomRight: `┘`.grey,

            bodyLeft: `│`.grey,
            bodyRight: `│`.grey,
            bodyJoin: `│`.grey,

            joinBody: `─`.grey,
            joinLeft: `├`.grey,
            joinRight: `┤`.grey,
            joinJoin: `┼`.grey
        },
        ...config
    });
}
