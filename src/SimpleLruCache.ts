import assert from 'node:assert/strict';

/**
 * Two-generation cache that promotes accessed older entries
 * to the recent generation.
 *
 * based on hashlru and mnemonist/lru-map
 * @see https://github.com/dominictarr/hashlru
 * @see https://github.com/Yomguithereal/mnemonist
 */

export default class SimpleLruCache<Key, Value> {
    private gen0 = new Map<Key, Value>();
    private gen1 = new Map<Key, Value>();
    private maxSize;

    /** Creates a cache with the given generation size limit. */
    constructor(maxSize: number) {
        assert(maxSize > 0, '`maxSize` must be a number greater than 0');
        this.maxSize = maxSize;
    }

    /** Removes all cached entries. */
    clear() {
        this.gen0 = new Map();
        this.gen1 = new Map();
    }

    /** Returns a cached value, promoting it if it is in the older generation. */
    get(key: Key) {
        if (this.gen0.has(key)) {
            return this.gen0.get(key);
        } else if (this.gen1.has(key)) {
            const value = this.gen1.get(key)!;
            this.addToRecent(key, value);
            return value;
        }
        return undefined;
    }

    /** Returns a cached value, or computes and caches one if absent. */
    getOrCreate(key: Key, createValue: () => Value) {
        if (this.gen0.has(key)) {
            return this.gen0.get(key)!;
        } else if (this.gen1.has(key)) {
            const value = this.gen1.get(key)!;
            this.addToRecent(key, value);
            return value;
        } else {
            const value = createValue();
            this.addToRecent(key, value);
            return value;
        }
    }

    /** Returns whether the key is present in either generation. */
    has(key: Key) {
        return this.gen0.has(key) || this.gen1.has(key);
    }

    /** Adds or updates a value in the cache and returns it. */
    set(key: Key, value: Value) {
        if (this.gen0.has(key)) {
            this.gen0.set(key, value);
        } else {
            this.addToRecent(key, value);
        }
        return value;
    }

    private addToRecent(key: Key, value: Value) {
        if (this.gen0.size >= this.maxSize) {
            this.gen1 = this.gen0;
            this.gen0 = new Map();
        }
        this.gen0.set(key, value);
    }
}
