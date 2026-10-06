import { beforeEach, describe, expect, it, vi } from 'vitest';
import SimpleLruCache from '../src/SimpleLruCache.ts';

describe('SimpleLruCache', () => {
    let cache: SimpleLruCache<string, number>;

    beforeEach(() => {
        cache = new SimpleLruCache(2);
    });

    it('returns undefined and reports false for a missing key', () => {
        expect(cache.get('missing')).toBeUndefined();
        expect(cache.has('missing')).toBe(false);
    });

    it('stores, retrieves, and updates values', () => {
        expect(cache.set('answer', 42)).toBe(42);
        expect(cache.has('answer')).toBe(true);
        expect(cache.get('answer')).toBe(42);

        cache.set('answer', 99);
        expect(cache.get('answer')).toBe(99);
    });

    it('promotes a retrieved older-generation entry', () => {
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3); // Moves a and b to the older generation.

        expect(cache.get('a')).toBe(1); // Promotes a to the recent generation.

        cache.set('d', 4); // The next rollover retains a but evicts b.
        expect([cache.has('a'), cache.get('a')]).toStrictEqual([true, 1]);
        expect([cache.has('b'), cache.get('b')]).toStrictEqual([false, undefined]);
    });

    it('discards the older generation when the recent generation rolls over again', () => {
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);
        cache.set('d', 4);
        cache.set('e', 5); // Rolls over again, discarding a and b.

        expect(cache.has('a')).toBe(false);
        expect(cache.has('b')).toBe(false);
        expect(cache.has('c')).toBe(true);
        expect(cache.has('d')).toBe(true);
        expect(cache.has('e')).toBe(true);
    });

    it('creates and caches a value when the key is missing', () => {
        const createValue = vi.fn(() => 42);

        expect(cache.getOrCreate('answer', createValue)).toBe(42);
        expect(cache.getOrCreate('answer', createValue)).toBe(42);
        expect(createValue).toHaveBeenCalledOnce();
    });

    it('getOrCreate promotes a retrieved older-generation entry', () => {
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3); // Moves a and b to the older generation.
        const createValue = vi.fn(() => 42);

        expect(cache.getOrCreate('a', createValue)).toBe(1);
        expect(cache.getOrCreate('b', createValue)).toBe(2);
        expect(createValue).toHaveBeenCalledTimes(0);
    });

    it('clears cached values', () => {
        cache.set('answer', 42);

        cache.clear();

        expect(cache.has('answer')).toBe(false);
        expect(cache.getOrCreate('answer', () => 99)).toBe(99);
    });
});
