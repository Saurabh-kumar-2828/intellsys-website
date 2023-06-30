declare global {
    var _memoryCache: Map<string, {value: string; expiresOn: number}> | null;
}

export class MemoryCache {
    cache: Map<string, {value: string; expiresOn: number}>;

    constructor(cache: Map<string, {value: string; expiresOn: number}>) {
        this.cache = cache;
    }

    async set(key: string, value: string) {
        // TODO: Handle expiration
        this.cache.set(key, {
            value: value,
            expiresOn: -1,
        });
    }

    async get(key: string): Promise<string | null> {
        // TODO: Handle expiration
        const cachedValue = this.cache.get(key);
        if (cachedValue == null) {
            return null;
        }

        return cachedValue.value;
    }

    async delete(key: string): Promise<void> {
        // TODO: Handle expiration
        this.cache.delete(key);
    }
}

export async function getMemoryCache(): Promise<MemoryCache> {
    return new MemoryCache(await getCache());
}

async function getCache(): Promise<Map<string, {value: string; expiresOn: number}>> {
    if (global._memoryCache == null) {
        global._memoryCache = new Map<string, {value: string; expiresOn: number}>();
    }

    return global._memoryCache;
}
