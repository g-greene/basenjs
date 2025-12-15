import multiparty from 'multiparty';
import { BaseObject } from '@basenjs/base';

export class BaseMultipartData extends BaseObject {
    _form = new multiparty.Form();
    _bodyRaw = Buffer.alloc(0);

    fields: any[] = [];
    files: any[] = [];
    
    public get form(): multiparty.Form {
        return this._form;
    }

    public get bodyRaw(): Buffer {
        return this._bodyRaw;
    }

    constructor() {
        super();
    }

    parse(request: any) {
        return this._parse(request);
    }

    parseRawText(text = '') {
        if(text.length < 1) {
            return;
        }
    }

    private _parse(request: any) {
        var _ = this;

        return new Promise((resolve, reject) => {

            let contentType = request.headers['content-type'] || '',
                chunks: Buffer[] = new Array<Buffer>();

            // Errors may be emitted
            // Note that if you are listening to 'part' events, the same error may be
            // emitted from the `form` and the `part`.
            _.form.on('error', function(err: any) {
                _.log.debug('initMultipart: Error parsing form: ' + err.stack);
            });

            _.form.on('pipe', function(readable: any) {
                _.log.debug('initMultipart: pipe ');
                if(readable) {
                    readable.on('data', (chunk: any) => {
                        _.log.debug('initMultipart: piped readable: data ');
                        _.log.debug('initMultipart: piped readable:' + chunk);
                        chunks.push(chunk);
                    });
                }
            });

            _.form.on('data', function(chunk: any) {
                _.log.debug('initMultipart: data ');
            });

            // Parts are emitted when parsing the form
            _.form.on('part', function(part: any) {
                // You *must* act on the part by reading it
                // NOTE: if you want to ignore it, just call "part.resume()"

                if (part.filename === undefined) {
                    // filename is not defined when this is a field and not a file
                    _.log.debug('initMultipart: got field named ' + part.name);
                    // ignore field's content
                    part.resume();
                }

                if (part.filename !== undefined) {
                    // filename is defined when this is a file
                    // count++;
                    _.log.debug('initMultipart: got file named ' + part.name);
                    // ignore file's content here
                    part.resume();
                }

                part.on('error', function(err: any) {
                    // decide what to do
                });
            });

            // Close emitted after form parsed
            _.form.on('close', function() {
                _.log.debug('initMultipart (requestIn): Upload completed!');
                // res.setHeader('text/plain');
                // res.end('Received ' + count + ' files');
                _._bodyRaw = Buffer.concat(chunks);
                resolve(_.bodyRaw);
            });

            if(contentType.match(/multipart/i) != null) {
                // Parse req
                _.form.parse(request);
            }
            else {
                resolve('');
            }
        });
    }
}
