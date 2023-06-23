import {getErrorFromUnknown, getIntegerFromUnknown} from "~/global-common-typescript/utilities/typeValidationUtilities";

declare global {
    var _cache: Map<string, {value: string, expiresOn: number}> | null;
}

function getCache(): Map<string, {value: string, expiresOn: number}> {
    if (global._cache == null) {
        global._cache = new Map<string, {value: string, expiresOn: number}>();
    }

    return global._cache;
}

export function putInCache(key: string, value: string) {
    const cache = getCache();

    // TODO: Handle expiration
    cache.set(key, {
        value: value,
        expiresOn: -1,
    });
};

export function getFromCache(key: string): string | null {
    const cache = getCache();

    // TODO: Handle expiration
    const cachedValue = cache.get(key);
    if (cachedValue == null) {
        return null;
    }

    return cachedValue.value;
};

export function removeFromCache(key: string): void {
    const cache = getCache();

    // TODO: Handle expiration
    cache.delete(key);
};
