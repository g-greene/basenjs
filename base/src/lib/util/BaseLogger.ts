import * as fs from 'node:fs';

export class BaseLogger {
    static write(message: string | any, prefix = 'INFO') {
        let now = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
        fs.appendFileSync('log.txt', prefix + '\t[' + now + ']' + ':\t' + message + '\r\n');
    }

    static info(message: string | any) {
        BaseLogger.write(message);
    }

    static debug(message: string | any) {
        BaseLogger.write(message, 'DEBUG');
    }

    static error(message: string | any) {
        BaseLogger.write(message, 'ERROR');
    }
}
