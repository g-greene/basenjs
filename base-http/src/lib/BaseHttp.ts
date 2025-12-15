import http from 'node:http';
import https from 'node:https';
import { Url } from 'node:url';

import { BaseObject } from '@basenjs/base';

export class BaseHttp extends BaseObject {
    constructor() {
        super();
        this.logLevel = 'none';
    }

    public static processResponse(response: http.IncomingMessage): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            // if(res.statusCode == '302') { // redirect
            // 	if('location' in res.headers) {
            // 		_.statusCode = 302;
            // 		_.setHeader('Location', res.headers['location']);
            // 	}
            // } 
        });
    }

    public static buildOptions(options: http.RequestOptions | any | Url): http.RequestOptions {
        let headers = options.headers || {},
            r : http.RequestOptions = {
                hostname: options.hostname || 'localhost',
                path: options.path || '/',
                port: options.port || (options.protocol==='https' ? 443 : 80),
                method: options.method || 'GET',
                headers: {
                    'Content-Type': headers['Content-Type'] || 'application/json',
                    'Connection': headers['Connection'] || 'keep-alive',
                    'Accept': headers['Accept'] || '*/*',
                    'Accept-Encoding': headers['Accept-Encoding'] || 'deflate, br, zstd',
                    ...headers
                }
            };

        return r;
    }

    public static head(options: http.RequestOptions | any | Url): Promise<http.ClientRequest | undefined> {
        return BaseHttp.request({ ...BaseHttp.buildOptions(options), method: 'HEAD' });
    }

    public static options(options: http.RequestOptions | any | Url): Promise<http.ClientRequest | undefined> {
        return BaseHttp.request({ ...BaseHttp.buildOptions(options), method: 'OPTIONS' });
    }

    public static get(options: http.RequestOptions | any | Url): Promise<http.ClientRequest | undefined> {
        return BaseHttp.request({ ...BaseHttp.buildOptions(options), method: 'GET' });
    }

    public static post(options: http.RequestOptions | any | Url, body: any): Promise<http.ClientRequest | undefined> {
        options.headers['Content-Length'] = body ? Buffer.byteLength(body) : 0;
        return BaseHttp.request({ ...BaseHttp.buildOptions(options), method: 'POST' }, body);
    }

    public static put(options: http.RequestOptions | any | Url, body: any): Promise<http.ClientRequest | undefined> {
        options.headers['Content-Length'] = body ? Buffer.byteLength(body) : 0;
        return BaseHttp.request({ ...BaseHttp.buildOptions(options), method: 'PUT' }, body);
    }

    public static patch(options: http.RequestOptions | any | Url, body: any): Promise<http.ClientRequest | undefined> {
        options.headers['Content-Length'] = body ? Buffer.byteLength(body) : 0;
        return BaseHttp.request({ ...BaseHttp.buildOptions(options), method: 'PATCH' }, body);
    }

    public static delete(options: http.RequestOptions | any | Url): Promise<http.ClientRequest | undefined> {
        return BaseHttp.request({ ...BaseHttp.buildOptions(options), method: 'DELETE' });
    }

    public static async request(options: http.RequestOptions | any | Url, body: any = null, callbacks: {request: (response: http.IncomingMessage) => void, data: (buffer: Buffer) => void, end: (buffer: Buffer) => void} = {request: () => {}, data: () => {}, end: () => {}}): Promise<http.ClientRequest | undefined> {
        var _ = this,
        buffer: Buffer = Buffer.alloc(0);

        const req = https.request(options, (res) => {
            console.log('<p>https://' + options.hostname + options.path + '</p>');
            console.log(`<p>STATUS: ${res.statusCode}</p>`);
            console.log(`<p>HEADERS: ${JSON.stringify(res.headers)}</p>`);
            
            res.setEncoding('utf8');

            callbacks.request(res);

            res.on('data', (chunk) => {
                // this.log.debug(`<p>BODY: ${chunk}</p>`);
                buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
                callbacks.data(buffer);
            });

            res.on('end', () => {
                // this.log.debug('No more data in response.');
                callbacks.end(buffer);
                return buffer;
            });
        });

        req.on('error', (e) => {
            console.log(`problem with request: ${e.message}`);
            console.log(e.stack);

            throw(e);
        });

        if (body && (options.method?.toLowerCase() in ['post', 'put', 'patch'])) {
            req.write(body);
        }

        req.end();

        return req;
    }
}