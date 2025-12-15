import http from 'node:http';
import { Url } from 'node:url';

import qs from 'qs';

import { BaseObject } from '@basenjs/base';

import { BaseHttpBody } from './BaseHttpBody';
import { BaseMultipartData } from './BaseMultipartData';

export class BaseHttpProxy extends BaseObject {
    requestIn: http.IncomingMessage;
    responseOut: http.ServerResponse;
    forwardComplete = false;
    _multipartData = new BaseMultipartData();

    _requestInBodyReader: BaseHttpBody;;
    _responseInBodyReader: BaseHttpBody;

    forwardWaitCount = 0;

    httpRequest: http.ClientRequest = http.request({});

    httpRequestInRawChunks: Buffer[] = [];
    httpRequestInRaw = Buffer.alloc(0);

    httpResponseRawChunks: Buffer[] = [];
    httpResponseRaw = Buffer.alloc(0);

    httpResponseRawChunksSize = 0;

    WRITEABLE  = {
        'post':'POST',
        'patch':'PATCH',
        'put':'PUT'
    };

    HOST = 'ws.anything-2493814af352';
    PATH_BASE = '/_p';
    MAX_WAIT_COUNT = 30; // in seconds

    constructor(requestIn: any, responseOut: any) {
        super();
        this.requestIn = requestIn;
        this.responseOut = responseOut;

        this._requestInBodyReader = new BaseHttpBody(this.requestIn);
        this._responseInBodyReader = new BaseHttpBody(this.responseOut);
    }

    async forwardRequest() {

        this.log.info('forwardRequest()');

        this._initForwardRequest();

        // this.httpRequest.end(); // move this to areas after writing

        while(!this.forwardComplete && this.forwardWaitCount < this.MAX_WAIT_COUNT) {
            await this.sleep(1000);
            this.forwardWaitCount++;
        }
    }

    sleep(millis: number) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    initEvents() {
        var _ = this;

        this.httpRequest.on('socket', function (socket: any) {
            _.log.debug('socket (httpRequest out)');

            socket.on('data', (chunk: string) => {
                _.httpResponseRawChunksSize += chunk.length;
                _.httpResponseRawChunks.push(Buffer.from(chunk));
                _.log.debug('socket data chunk size (httpRequest out): ' + _.httpResponseRawChunksSize);
                _.log.debug('socket data chunk (httpRequest out): ' + chunk);
            });

            socket.on('end', () => {
                _.log.debug('socket end (httpRequest out)');
            });

            socket.on('close', () => {
                _.log.debug('socket close  (httpRequest out)');
                _.log.debug('socket close chunk size (httpRequest out): ' + _.httpResponseRawChunksSize);
            });

            socket.resume();
        });
    }


    _initHeaders() {
        let contentType = this.requestIn.headers['content-type'];

        this.requestIn.headers['host'] = this.HOST;

        if(this.requestIn?.method?.toLowerCase() == 'post' && contentType?.match(/multipart/i) == null) {
            this.log.info('setting content type for post');
            this.requestIn.headers['content-type'] = 'application/x-www-form-urlencoded';
            delete this.requestIn.headers['connection'];
            // delete this.requestIn.headers['keep-alive'];
        }
    }


    _initForwardRequest() {
        var _= this;

        this.log.info('_initForwardRequest()');

        this._initHeaders();

        // DEBUG
        this.log.debug('_initForwardRequest method (requestIn):' + this.requestIn.method);
        // this.log.debug('_initForwardRequest body (requestIn):' + JSON.stringify(this.requestIn.body));
        this.log.debug('_initForwardRequest headers (requestIn):' + JSON.stringify(this.requestIn.headers));
        // this.log.debug('_initForwardRequest path (requestIn):' + JSON.stringify(this.requestIn.path));

        this._requestInBodyReader = new BaseHttpBody(this.requestIn);

        this._requestInBodyReader.readAsBuffer().then((data: Buffer) => {
            this.log.debug('_requestInBodyReader finished reading');
            _.httpRequestInRaw.write(data.toString());
            _._forwardRequest();
        });
    }

    _forwardRequest() {
        let url: URL = new URL(this.requestIn.url || ''),
            query = qs.stringify(url.searchParams),
            path = url.pathname?.replace(this.PATH_BASE, '') + (query != '' ? '?' + query : '');

        this.log.debug('_forwardRequest path (requestIn): ' + qs.stringify(url.pathname));
        this.log.debug('_forwardRequest query (requestIn): ' + qs.stringify(url.searchParams));

        const options = {
            protocol: 'http:',
            host: this.HOST,
            port: 14599,
            path: path,
            method: this.requestIn.method,
            headers: this.requestIn.headers,
        };

        this.log.debug(JSON.stringify(options));

        var _ = this;

        this.httpRequest = http.request(options); 
        
        this.httpRequest.on('response', (responseIn) => 
        {
            _.log.info('httpRequest response:');

            _._responseInBodyReader = new BaseHttpBody(responseIn);

            _._responseInBodyReader.readAsBuffer().then((data) => {
                _.log.debug('_responseInBodyReader finished reading');

                let headers: http.OutgoingHttpHeaders = {},
                dataBuffer = Buffer.alloc(0),
                contentType: string | string[] = responseIn.headers['Content-Type'] || '';

                contentType = typeof contentType == 'string' ? contentType : contentType.join('; ');

                _.log.debug('-- end event (callback)');
                _.log.debug('-- chunks collected length: ' + Buffer.byteLength(data));
                _.log.debug('-- chunks: ' + data.toString());

                let fIsolateData = function(httpResponseRaw: Buffer) {
                    let EOH = '\r\n\r\n',
                    eohPos = -1;
                    return(httpResponseRaw.slice(httpResponseRaw.indexOf(EOH) + EOH.length));
                };

                dataBuffer = fIsolateData(Buffer.concat(_.httpResponseRawChunks));

                if(contentType.length > 0) {
                    headers['Content-Type'] = responseIn.headers['content-type'];

                    if(contentType.match(/multipart|image/i) != null) {
                        headers['Content-Length'] = Buffer.byteLength(dataBuffer);
                    }

                    // if(responseIn.headers['content-type'] == 'image/png') {
                    // 	headers['Content-Length'] = Buffer.byteLength(dataBuffer);
                    // }
                }
                else {
                    headers['Content-Type'] = 'application/json';
                }

                _.log.debug('sending response with headers: ' + JSON.stringify(headers));

                if(contentType.match(/json|text|html|xml/gim) != null) {
                    _.log.debug('sending text');
                    _.log.debug('sending text headers (responseOut):' + JSON.stringify(headers));

                    _.responseOut.write(data);
                }
                else {
                    _.log.debug('sending binary');
                    _.log.debug('sending binary headers (responseOut):' + JSON.stringify(headers));
                    // Logger.debug(data);

                    _.responseOut.writeHead(responseIn.statusCode!, headers);
                    _.responseOut.write(dataBuffer);
                }

                // _.log.debug('buffer:');
                // _.log.debug(data);
                // _.log.debug('-- end buffer');

                // this writes everything out and is not contexualized by content type above
                // responseOut.send(data);

                _.forwardComplete = true;
            });
        });

        this.initEvents();

        let method = this.requestIn?.method?.toLowerCase() || '';

        if(method in this.WRITEABLE) {
            this.log.info('writing writeable: ' + Buffer.byteLength(this.httpRequestInRaw));
            this._writeWritable(this.httpRequestInRaw).then((bodyWritten) => {
                this.httpRequest.end();
            });
        }
        else {
            this.httpRequest.end(this.httpRequestInRaw);
        }

        // 	this._multipartData.parse(this.requestIn).then(bodyRaw => {
        // 		this.writePost();
        // 	});
    }


    _writeWritable(bodyBuffer: Buffer) {

        var _ = this;

        return new Promise((resolve, reject) => {

            let contentType = _.requestIn.headers['Content-Type'] || '',
                bodyObject = null,
                dataPostParts = [],
                method = this.requestIn?.method?.toLowerCase() || '';

            contentType = typeof contentType == 'string' ? contentType : contentType.join('; ');

            if(!bodyBuffer || (!(method in _.WRITEABLE))) {
                resolve([]);
            }

            if(method == 'post' && contentType.match(/multipart/i) == null) {
                bodyObject = JSON.parse(bodyBuffer.toString());

                _.log.debug('writing post:' + JSON.stringify(bodyObject));
                _.log.debug('post data: ' + JSON.stringify(bodyObject));
                for(let key in bodyObject) {
                    dataPostParts.push(key + '=' + encodeURIComponent(bodyObject[key]));
                }

                _.log.debug('writing post data: ' + dataPostParts.join('&'));

                _.httpRequest.write(dataPostParts.join('&'));

                resolve(dataPostParts);
            }
            else {
                _.log.debug('writing data: ' + JSON.stringify(bodyBuffer));
                _.httpRequest.write(bodyBuffer);

                resolve(bodyBuffer);
            }
        });
    }
}
