import { describe, expect, it } from 'vitest';
import * as C from '../src/constants.ts';
import RequestSigner from '../src/RequestSigner.ts';
import SignableRequest from '../src/SignableRequest.ts';
import { getSignedUrl, prepareRequest } from '../src/request-signing.ts';

describe('request-signing', () => {
    const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey:
            'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
    };

    const signingOptions = {
        credentials,
        date: '20240102T030405Z',
        region: 'eu-west-1',
        service: 's3',
    };

    it('prepares a signer from a request configuration', () => {
        const signer = prepareRequest(
            {
                url: 'https://example.com/file.txt',
                method: 'GET',
            },
            signingOptions,
        );

        expect(signer).toBeInstanceOf(RequestSigner);
        expect(signer.request).toBeInstanceOf(SignableRequest);
        expect(signer.request.url.href).toBe(
            'https://example.com/file.txt',
        );
        expect(signer.scope).toEqual({
            datetime: '20240102T030405Z',
            region: 'eu-west-1',
            service: 's3',
        });
    });

    it('reuses an existing SignableRequest instance', () => {
        const request = new SignableRequest({
            url: 'https://example.com/file.txt',
            method: 'GET',
        });

        const signer = prepareRequest(request, signingOptions);

        expect(signer.request).toBe(request);
    });

    it('returns a signed URL with Signature Version 4 query parameters', () => {
        const signedUrl = getSignedUrl(
            {
                url: 'https://ds9.s3.eu-west-1.amazonaws.com/file.txt',
            },
            {
                ...signingOptions,
                expires: 900,
            },
        );

        const url = new URL(signedUrl);

        expect(url.origin).toBe('https://ds9.s3.eu-west-1.amazonaws.com');
        expect(url.pathname).toBe('/file.txt');

        expect(url.searchParams.get(C.HEADER_AMZ_ALGORITHM)).toBe(
            C.AWS_ALGORITHM,
        );
        expect(url.searchParams.get(C.HEADER_AMZ_CREDENTIAL)).toBe(
            'AKIAIOSFODNN7EXAMPLE/20240102/eu-west-1/s3/aws4_request',
        );
        expect(url.searchParams.get(C.HEADER_AMZ_DATE)).toBe(
            '20240102T030405Z',
        );
        expect(url.searchParams.get(C.HEADER_AMZ_EXPIRES)).toBe('900');
        expect(url.searchParams.get(C.HEADER_AMZ_SIGNEDHEADERS)).toBe('host');
        expect(url.searchParams.get(C.HEADER_AMZ_SIGNATURE)).toMatch(
            /^[0-9a-f]{64}$/,
        );
    });
});