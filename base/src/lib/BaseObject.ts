import { BaseLogger } from './util/BaseLogger';

export class BaseObject {
    _logLevel: 'info' | 'debug' | 'error' | 'all' | 'none' = 'none';
    _canDebug = false;
    _canLog = false;
    _log = {
        info: (message: string | any) => { (!this._canDebug && this._logLevel==='info') || console.log(message); !this._canLog || BaseLogger.info(message); },
        debug: (message: string | any) => { (!this._canDebug && this._logLevel==='debug') || console.debug(message); !this._canLog || BaseLogger.debug(message); },
        error: (message: string | any) => { (!this._canDebug && this._logLevel==='error') || console.error(message); !this._canLog || BaseLogger.error(message); }
    };

    constructor() {}

    public get log(): any {
        return this._log;
    }

    public get logLevel(): 'info' | 'debug' | 'error' | 'all' | 'none' {
        return this._logLevel;
    }

    public set logLevel(level: 'info' | 'debug' | 'error' | 'all' | 'none') {
        this._logLevel = level;
    }

    toString() {
        return '[object BaseObject]';
    }
}