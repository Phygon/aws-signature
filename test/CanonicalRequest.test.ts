import { describe, expect, it } from 'vitest';
import CanonicalRequest from '../src/CanonicalRequest.ts';
import SignableRequest from '../src/SignableRequest.ts';

describe('CanonicalRequest', () => {
    const request = new SignableRequest({
        url:
            'https://ds9.example.com/resource' +
            '?z=last%20value&foo=bar+baz&foo=hello%20world&empty',
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'X-Amz-Date': '20240102T030405Z',
            'X-Amz-Meta-Note': '  alpha   beta,  gamma ',
        },
        contentHash: '0xdeadbeef',
    });

    it('canonicalizes and sorts query parameters', () => {
        const creq = new CanonicalRequest(request);

        expect(creq.canonicalQuery).toBe(
            'empty=&foo=bar%20baz&foo=hello%20world&z=last%20value',
        );
    });

    it('canonicalizes required and explicitly signable headers', () => {
        const creq = new CanonicalRequest(
            request,
            new Set(['content-type']),
        );

        expect(creq.canonicalHeaders).toBe(
            [
                'content-type:text/plain',
                'host:ds9.example.com',
                'x-amz-date:20240102T030405Z',
                'x-amz-meta-note:alpha beta,gamma',
                '', // canonical headers terminate with a blank line
            ].join('\n'),
        );

        expect(creq.signedHeaders).toBe(
            'content-type;host;x-amz-date;x-amz-meta-note',
        );
    });

    it('assembles the canonical request', () => {
        const creq = new CanonicalRequest(
            request,
            new Set(['content-type']),
        );

        expect(creq.toString()).toBe(
            [
                'POST',
                '/resource',
                'empty=&foo=bar%20baz&foo=hello%20world&z=last%20value',
                'content-type:text/plain',
                'host:ds9.example.com',
                'x-amz-date:20240102T030405Z',
                'x-amz-meta-note:alpha beta,gamma',
                '',
                'content-type;host;x-amz-date;x-amz-meta-note',
                '0xdeadbeef',
            ].join('\n'),
        );
    });
});