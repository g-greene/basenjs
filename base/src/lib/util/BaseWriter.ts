import stream from 'node:stream';
import { writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { createWriteStream } from 'node:fs';

export class BaseWriter {
    utf8(data: string | Buffer, filename = 'writer-utf8.txt') {
        writeFile('datafile.txt', data, 'utf8').then(() => {});
    }

    binary(data: any, filename = 'writer-binary.bin') {
        writeFile('binary.txt', data, 'binary').then(() => {});
    }

    stream(data: any, filename = 'writer-stream.bin') {
        let binaryStream = new stream.PassThrough(),
            writeStream = createWriteStream('binaryAsStream.bin');

        binaryStream.end(Buffer.from(data, 'binary'));

        binaryStream.once('end', () => {
            // written
        });

        binaryStream.once('error', (err: Error) => {
            // error
        });

        binaryStream.pipe(writeStream);
    }
}
