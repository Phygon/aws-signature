// test/RequestSigner.test.ts
import { describe, expect, it, vi } from 'vitest';
import * as C from '../src/constants.ts';
import RequestSigner from '../src/RequestSigner.ts';
import SignableRequest from '../src/SignableRequest.ts';

describe('RequestSigner', () => {
    const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey:
            'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
    };

    const url = 'https://ds9.s3.eu-west-1.amazonaws.com/file.txt';
    const signingDate = '20240102T030405Z';
    const sessionToken = 'session-token-example';

    it('uses the current date when no date is provided', () => {
        const currentDate = new Date('2063-04-05T09:08:07.000Z');

        vi.useFakeTimers();
        vi.setSystemTime(currentDate);

        try {
            const request = new SignableRequest({ url });
            const signer = new RequestSigner(request, {
                credentials,
            });

            expect(signer.scope.datetime).toBe('20630405T090807Z');
        } finally {
            vi.useRealTimers();
        }
    });

    it('infers the service and region and prepares signed headers', () => {
        const request = new SignableRequest({ url });
        const signer = new RequestSigner(request, {
            credentials,
            date: signingDate,
        });

        expect(signer.scope).toEqual({
            datetime: signingDate,
            region: 'eu-west-1',
            service: 's3',
        });

        signer.prepareRequest();
        signer.prepareRequest();

        expect(request.headers.get(C.HEADER_AMZ_DATE)).toBe(signingDate);
        expect(request.headers.get(C.HEADER_AUTHORIZATION)).toBeNull();
    });

    it('infers the service and region for non S3 services', () => {
        const request = new SignableRequest({ url: 'https://iam.ap-northeast-1.amazonaws.com/file.txt' });
        const signer = new RequestSigner(request, {
            credentials,
            date: signingDate,
        });

        expect(signer.scope).toEqual({
            datetime: signingDate,
            region: 'ap-northeast-1',
            service: 'iam',
        });
    });

    it('adds an authorization header when signing a request', () => {
        const request = new SignableRequest({ url });
        const signer = new RequestSigner(request, {
            credentials,
            date: signingDate,
        });

        const signedRequest = signer.sign();

        expect(signedRequest).toBe(request);

        const authorization = request.headers.get(
            C.HEADER_AUTHORIZATION,
        );

        expect(authorization).toMatch(
            new RegExp(
                `^${C.AWS_ALGORITHM} ` +
                    `Credential=${credentials.accessKeyId}/20240102/eu-west-1/s3/aws4_request, ` +
                    `SignedHeaders=host;x-amz-date, ` +
                    `Signature=[0-9a-f]{64}$`,
            ),
        );
    });

    it('adds Signature Version 4 parameters to the query string when signing', () => {
        const request = new SignableRequest({ url });
        const signer = new RequestSigner(request, {
            credentials,
            date: signingDate,
            expires: 900,
            signQuery: true,
        });

        const signedRequest = signer.sign();

        const { searchParams } = signedRequest.url;

        expect(searchParams.get(C.HEADER_AMZ_DATE)).toBe(signingDate);
        expect(searchParams.get(C.HEADER_AMZ_EXPIRES)).toBe('900');
        expect(searchParams.get(C.HEADER_AMZ_ALGORITHM)).toBe(C.AWS_ALGORITHM);
        expect(searchParams.get(C.HEADER_AMZ_CREDENTIAL)).toBe(
            [
                credentials.accessKeyId,
                '20240102/eu-west-1/s3/aws4_request',
            ].join('/'),
        );
        expect(searchParams.get(C.HEADER_AMZ_SIGNEDHEADERS)).toBe('host');
        expect(searchParams.get(C.HEADER_AMZ_SIGNATURE)).toMatch(/^[0-9a-f]{64}$/);
    });

    it('throws when no secret access key is available', () => {
        const request = new SignableRequest({ url });
        const signer = new RequestSigner(request, {
            credentials: {
                ...credentials,
                secretAccessKey: '',
            },
            date: signingDate,
        });

        expect(() => signer.createSignature('string-to-sign')).toThrowError(
            'secretAccessKey is required to derive a signing key',
        );
    });

    it('includes a session token in the signed request', () => {
        const request = new SignableRequest({ url });
        const signer = new RequestSigner(request, {
            credentials: {
                ...credentials,
                sessionToken,
            },
            date: signingDate,
        });

        signer.prepareRequest();

        expect(request.headers.get(C.HEADER_AMZ_SECURITY_TOKEN)).toBe(sessionToken);
    });

    it('adds a session token to presigned query parameters', () => {
        const request = new SignableRequest({ url });
        const signer = new RequestSigner(request, {
            credentials: {
                ...credentials,
                sessionToken,
            },
            date: signingDate,
            signQuery: true,
        });

        signer.prepareRequest();

        expect(request.url.searchParams.get(C.HEADER_AMZ_SECURITY_TOKEN)).toBe(sessionToken);
        expect(request.headers.get(C.HEADER_AMZ_SECURITY_TOKEN)).toBeNull();
    });
});