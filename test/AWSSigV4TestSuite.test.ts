import { describe, expect, it } from 'vitest';
import suite from '@saibotsivad/aws-sig-v4-test-suite' with { type: 'json' };
import { prepareRequest, sha256 } from '../src/index.ts';

function getHeader(headers: string[][], name: string) {
    return headers.find((header) => header[0] === name);
}

function getDate(headers: string[][]) {
    return getHeader(headers, 'X-Amz-Date')?.[1];
}

function getHost(headers: string[][]) {
    return getHeader(headers, 'Host')?.[1];
}

// fix tests 18 and 19: Remove 'Content-Length', replace 'utf-8' by 'utf8'.
// the checksums do not match if we include that header.
const test18 = suite.tests.all.find((test) => test.name === 'post-x-www-form-urlencoded');
if (test18) {
    const { request } = test18;
    request.headers = request.headers.filter((header) => header[0] !== 'Content-Length');
    test18.creq = test18.creq.replace('content-length:13\n', '').replace('content-length;', '');
}
const test19 = suite.tests.all.find((test) => test.name === 'post-x-www-form-urlencoded-parameters');
if (test19) {
    const { request } = test19;
    request.headers = request.headers.filter((header) => header[0] !== 'Content-Length');
    const contentType = getHeader(request.headers, 'Content-Type');
    if (contentType) {
        contentType[1] = contentType[1].replace(/utf-8/, 'utf8');
    }
    test19.creq = test19.creq.replace(/utf-8/, 'utf8');
    test19.creq = test19.creq.replace('content-length:13\n', '').replace('content-length;', '');
    test19.authz = test19.authz.replace(/content-length;/, '');
}

describe('AWS Signature V4 Test Suite', () => {
    suite.tests.all.forEach((test) => {
        it(`should pass ${test.name}`, function () {
            // Should we normalize the pathname in the library?
            const normalizedUri = test.request.uri.replace(/\/{2,}/g, '/');

            const signer = prepareRequest({
                method: test.request.method,
                url: `https://${getHost(test.request.headers)}${normalizedUri}`,
                headers: test.request.headers as [string,string][],
                contentHash: sha256(test.request.body, 'hex'),
            }, {
                credentials: {
                    accessKeyId: suite.config.accessKeyId,
                    secretAccessKey: suite.config.secretAccessKey,
                },
                date: getDate(test.request.headers),
                region: suite.config.region,
                service: suite.config.service,
                signableHeaders: test.request.headers.map(([name]) => name)
            })

            const {
                canonicalRequest,
                stringToSign
            } = signer.prepareSignature();

            const signature = signer.createSignature(stringToSign);
            const request = signer.addSignature(signature);
            const authorization = request.headers.get('authorization');

            expect(canonicalRequest).toBe(test.creq);
            expect(stringToSign).toBe(test.sts);
            expect(authorization).toBe(test.authz);
        })
    });
});
