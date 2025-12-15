import http from 'node:http';

import { BaseObject } from '@basenjs/base';

export class BaseHttpBody extends BaseObject {
    _readable: http.ClientRequest | http.IncomingMessage;
    _chunks: Buffer[] = [];
    _dataWasRead: boolean = false;
    _ended: boolean = false;

    constructor(readable: http.ClientRequest | http.IncomingMessage | any) {
        super();
        this._readable = readable;
    }

    public get readable(): http.ClientRequest | http.IncomingMessage {
        return this._readable;
    }

    public get dataWasRead(): boolean {
        return this._dataWasRead;
    }

    async readAsBuffer(): Promise<Buffer> {
        var _ = this;

        return new Promise<Buffer>((resolve, reject) => {

            var applyResolve = function() {
                let readBody = '';
                if(!_.dataWasRead && ('body' in _.readable) && _.readable.body) {
                    // body can be an object

                    readBody = typeof _.readable.body == 'object' ? JSON.stringify(_.readable.body) : _.readable.body + '';
                    _.log.info('BodyReader::readBodyAsBuffer _readable.body: ' + readBody);
                    _._chunks.push(Buffer.from(readBody));
                }
                resolve(Buffer.concat(_._chunks));
            };

            this._readable.on("data", (chunk: Buffer) => {
                _._dataWasRead = true;
                _.log.debug('BodyReader event (data)');
                _._chunks.push(chunk);
            });

            this._readable.on('close', () => {
                _.log.debug('BodyReader event (close):');
                if(!_._ended) {
                    applyResolve();
                }
            });

            this._readable.on("end", () => {
                _.log.debug('BodyReader event (end):');
                _._ended = true;
                applyResolve();
            });

            this._readable.on("error", (error) => {
                _.log.error('BodyReader event (error): ' + error.message);
                throw new Error(error.message);
            });

        });
    };
}
