import { createHash, createHmac } from 'node:crypto';

/** Compares two key/value pairs for sorting in lexicographic order. */
export function comparePair<U, V>(
    [a0, a1]: [U, V],
    [b0, b1]: [U, V],
): number {
    if (a0 !== b0) return a0 < b0 ? -1 : 1;
    if (a1 !== b1) return a1 < b1 ? -1 : 1;
    return 0;
}

/** Percent-encodes a value using the RFC 3986 unreserved character set. */
export function encodeRfc3986(value: string): string {
    return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
        '%' + char.charCodeAt(0).toString(16).toUpperCase()
    );
}

/** convert `date` to the required ISO 8601 format: 'YYYYMMDDTTHHmmssZ' */
export function getDateTime(date: number | string | Date): string {
    if (typeof date === 'string' && /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/.test(date)) {
        return date;
    }
    return new Date(date).toISOString().replace(/[:\-]|\.\d{3}/g, '');
}

/** Returns HMAC-SHA-256 digest as bytes. */
export function hmacSha256(key: string | Uint8Array, data: string): Buffer;
/** Returns HMAC-SHA-256 digest as string. */
export function hmacSha256(key: string | Uint8Array, data: string, encoding: BufferEncoding): string;
export function hmacSha256(key: string | Uint8Array, data: string, encoding?: BufferEncoding): Buffer | string {
    const hash = createHmac('sha256', key).update(data);
    return encoding ? hash.digest(encoding) : hash.digest();
}

/** Returns the SHA-256 digest of a string or byte array as bytes. */
export function sha256(data: string): Buffer;
/** Returns the SHA-256 digest of a string or byte array as string. */
export function sha256(data: string, encoding: BufferEncoding): string;
export function sha256(data: string, encoding?: BufferEncoding): Buffer | string {
    const hash = createHash('sha256').update(data);
    return encoding ? hash.digest(encoding) : hash.digest();
}
