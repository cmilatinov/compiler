import { Transform } from 'stream';
import { Console } from 'console';

export function stringTable(tableObject) {
    const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
    const logger = new Console({ stdout: ts });
    logger.table(tableObject);
    return (ts.read() || '').toString();
}
