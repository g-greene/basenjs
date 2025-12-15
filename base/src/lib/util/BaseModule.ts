
export class BaseModule {
    static async load(path: string, type: 'esm' | 'commonjs' = 'esm') {
        try {
            const imported = (type === 'esm') ? 
                await import(`${path}?ut=${Date.now()}`) : await require(`${path}?ut=${Date.now()}`);
            return imported;
        }
        catch(e) {
            throw(e);
        }
    }

    static async loadAll(paths: string[]) {
        const modules = [];
        for(const path of paths) {
            const mod = await BaseModule.load(path);
            modules.push(mod);
        }
        return modules;
    }

    static async loadFromObject(obj: {[key: string]: string}) {
        const modules: {[key: string]: any} = {};
        for(const key in obj) {
            modules[key] = await BaseModule.load(obj[key]);
        }   
        return modules;
    }

    static async loadAllFromObject(obj: {[key: string]: string[]}) {
        const modules: {[key: string]: any[]} = {};
        for(const key in obj) {
            modules[key] = await BaseModule.loadAll(obj[key]);
        }
        return modules;
    }
}
