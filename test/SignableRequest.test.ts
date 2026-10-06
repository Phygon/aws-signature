import { describe, expect, it } from 'vitest';
import SignableRequest from '../src/SignableRequest.ts';

describe('SignableRequest', () => {
    it('creates a request with sensible defaults', () => {
        const request = new SignableRequest({
            url: 'https://bucket-name.s3.eu-west-1.amazonaws.com/file.txt',
        });

        expect(request.url.href).toBe(
            'https://bucket-name.s3.eu-west-1.amazonaws.com/file.txt',
        );
        expect(request.method).toBe('GET');
        expect(request.headers.get('host')).toBe(
            'bucket-name.s3.eu-west-1.amazonaws.com',
        );
        expect(request.contentHash).toBe('UNSIGNED-PAYLOAD');

        expect(request.requestInit()).toEqual({
            method: 'GET',
            headers: request.headers,
        });
    });

    it('preserves the configured method, headers, and content hash', () => {
        const request = new SignableRequest({
            url: new URL('https://example.com/upload'),
            method: 'PUT',
            headers: {
                'Content-Type': 'text/plain',
                'X-Custom-Header': 'example',
            },
            contentHash: 'a'.repeat(64),
        });

        expect(request.url.href).toBe('https://example.com/upload');
        expect(request.method).toBe('PUT');
        expect(request.headers.get('content-type')).toBe('text/plain');
        expect(request.headers.get('x-custom-header')).toBe('example');
        expect(request.contentHash).toBe('a'.repeat(64));

        // Host is added automatically when it was not supplied.
        expect(request.headers.get('host')).toBe('example.com');
    });

    it('does not overwrite an explicitly configured host header', () => {
        const request = new SignableRequest({
            url: 'https://localhost:8080/file.txt',
            headers: {
                Host: 'custom.example.com',
            },
        });

        expect(request.headers.get('host')).toBe('custom.example.com');
    });
});