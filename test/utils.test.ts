import { describe, expect, it } from 'vitest';
import { comparePair, encodeRfc3986, getDateTime, hmacSha256, sha256 } from '../src/utils.ts';

const hex2b64 = (hex: string) => Buffer.from(hex, 'hex').toString('base64');

describe('comparePair', () => {
    it('returns -1 when the first value is smaller', () => {
        expect(comparePair(['a', 'z'], ['b', 'a'])).toBe(-1);
    });

    it('returns 1 when the first value is greater', () => {
        expect(comparePair(['b', 'a'], ['a', 'z'])).toBe(1);
    });

    it('returns -1 when first values are equal and the second is smaller', () => {
        expect(comparePair(['a', 'a'], ['a', 'b'])).toBe(-1);
    });

    it('returns 1 when first values are equal and the second is greater', () => {
        expect(comparePair(['a', 'b'], ['a', 'a'])).toBe(1);
    });

    it('returns 0 when both values are equal', () => {
        expect(comparePair(['a', 'b'], ['a', 'b'])).toBe(0);
    });
});

describe('encodeRfc3986', () => {
    it('leaves RFC 3986 unreserved characters unchanged', () => {
        expect(encodeRfc3986('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe(
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        );

        expect(encodeRfc3986('abcdefghijklmnopqrstuvwxyz0123456789-._~')).toBe(
            'abcdefghijklmnopqrstuvwxyz0123456789-._~',
        );
    });

    it('percent-encodes reserved characters', () => {
        expect(encodeRfc3986(":/?#[]@!$&'()*+,;=")).toBe(
            '%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D',
        );
    });

    it('encodes spaces and Unicode using UTF-8 percent encoding', () => {
        expect(encodeRfc3986('Live long and prosper. 🖖')).toBe(
            'Live%20long%20and%20prosper.%20%F0%9F%96%96',
        );
    });

    it('encodes apostrophes, parentheses, exclamation marks, and asterisks', () => {
        expect(encodeRfc3986("It's logical! (Really)*")).toBe(
            'It%27s%20logical%21%20%28Really%29%2A',
        );
    });
});

describe('getDateTime', () => {
    const timestamp = 1704164645000; // 2024-01-02T03:04:05.000Z
    const isoDate = '2024-01-02T03:04:05.000Z';
    const expected = '20240102T030405Z';

    it('formats a Date input', () => {
        expect(getDateTime(new Date(timestamp))).toBe(expected);
    });

    it('accepts an already formatted string input', () => {
        expect(getDateTime(expected)).toBe(expected);
    });

    it('formats an ISO string input', () => {
        expect(getDateTime(isoDate)).toBe(expected);
    });

    it('formats a numeric timestamp input', () => {
        expect(getDateTime(timestamp)).toBe(expected);
    });
});

describe('sha256', () => {
    const input = 'Live long and prosper. 🖖';
    const expectedHex =
        '2dc07824dad75521bcb41f54a698f9bcdc695ded27af6e48db6f217deaa79e1e';

    it('returns a Buffer by default', () => {
        const result = sha256(input);

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result).toEqual(Buffer.from(expectedHex, 'hex'));
    });

    it('returns a hexadecimal string when requested', () => {
        expect(sha256(input, 'hex')).toBe(expectedHex);
    });

    it('returns a base64 string when requested', () => {
        expect(sha256(input, 'base64')).toBe(hex2b64(expectedHex));
    });
});

describe('hmacSha256', () => {
    const key = 'Resistance is futile.';
    const data = 'Live long and prosper. 🖖';
    const expectedHex =
        '998fcba7038ad2b2829601afedab850fe719a954c209ad0b8dc113902823698b';

    it('returns a Buffer by default', () => {
        const result = hmacSha256(key, data);

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result).toEqual(Buffer.from(expectedHex, 'hex'));
    });

    it('returns a hexadecimal string when requested', () => {
        expect(hmacSha256(key, data, 'hex')).toBe(expectedHex);
    });

    it('returns a base64 string when requested', () => {
        expect(hmacSha256(key, data, 'base64')).toBe(hex2b64(expectedHex));
    });
});