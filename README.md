# aws-signature

> A Node.js and TypeScript library for creating AWS Signature Version 4 signed requests and presigned URLs.

The library exposes the signing steps needed to inspect or customize a request: request preparation, canonical request construction, string-to-sign generation, signing-key derivation, and final signature application.

## Quick start: presigned URL

Use `getSignedUrl` when the signature should be included in query parameters instead of an `Authorization` header:

```ts
import { getSignedUrl } from 'aws-signature';

const url = getSignedUrl(
    {
        url: 'https://bucket-name.s3.eu-west-1.amazonaws.com/file.txt',
        method: 'GET',
    },
    {
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN,
        },
        expires: 900,
    },
);

console.log(url);
```

The default presigned URL lifetime is `3600` seconds. Set `expires` to a different number of seconds when needed.

## Signed requests

Use `prepareRequest` to configure a signer from either a request configuration or an existing `SignableRequest`:

```ts
import { prepareRequest } from 'aws-signature';

const signer = prepareRequest(
    {
        url: 'https://bucket-name.s3.eu-west-1.amazonaws.com/file.txt',
        method: 'GET',
    },
    {
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            sessionToken: process.env.AWS_SESSION_TOKEN,
        },
    },
);

const signedRequest = signer.sign();

const response = await fetch(
    signedRequest.url,
    signedRequest.requestInit(),
);
```

Signing is synchronous. The returned `SignableRequest` contains the signed headers and can be used to initialize `fetch` or another HTTP client.

## Inspecting the signing process

`RequestSigner` exposes the canonical request and string to sign before the final signature is added:

```ts
const { canonicalRequest, stringToSign } = signer.prepareSignature();
const signature = signer.createSignature(stringToSign);
const signedRequest = signer.addSignature(signature);
```

This is useful when debugging AWS signature mismatches or integrating a custom signing flow.

`createSignature` throws an error when `credentials.secretAccessKey` is empty or missing.

## Request configuration

A request configuration accepts these fields:

| Field | Description | Default |
| --- | --- | --- |
| `url` | Request URL object or string | Required |
| `method` | HTTP method | `GET` |
| `headers` | Initial request headers | Empty `Headers` object |
| `contentHash` | SHA-256 payload hash in hexadecimal | `UNSIGNED-PAYLOAD` |

`SignableRequest` adds the URL host as the `Host` header when one is not already present.

For payloads that must be signed, calculate the SHA-256 digest and pass it as `contentHash`:

```ts
import { sha256 } from 'aws-signature';

const payload = JSON.stringify({ message: 'Live long and prosper.' });

const request = {
    url: 'https://example.amazonaws.com/resource',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
    },
    contentHash: sha256(payload, 'hex'),
};
```

## Signing options

| Option | Description | Default |
| --- | --- | --- |
| `credentials` | AWS access key, secret key, and optional session token | Required |
| `date` | Signing timestamp as number, string or `Date` | Current time |
| `region` | AWS region | Inferred from the hostname when possible |
| `service` | AWS service name | Inferred from the hostname when possible |
| `expires` | Presigned URL lifetime in seconds | `3600` |
| `signQuery` | Put signing parameters in the query string | `false` |
| `signableHeaders` | Additional header names to include in the signature | None |

The signer always includes `host` and `x-amz-*` headers in the signed-header list. Header names supplied through `signableHeaders` are normalized to lowercase.

For AWS hostnames, the service and region are inferred from the hostname. For non-AWS endpoints, the defaults are `s3` and `auto`; provide `service` and `region` explicitly when those defaults are not appropriate.

## Temporary credentials

Temporary AWS credentials can be supplied with `sessionToken`. The token is added to the signed request headers or, for a presigned URL, to its query parameters.

```ts
const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN!,
};
```

## Canonical requests

`CanonicalRequest` produces the components used by Signature Version 4:

- HTTP method
- URI pathname
- sorted and RFC 3986-encoded query string
- normalized canonical headers
- signed-header names
- payload hash

Use it when inspecting canonicalization or debugging a signature mismatch.

## Low-level helpers

The utility functions can be used independently:

```ts
import {
    encodeRfc3986,
    hmacSha256,
    sha256,
} from 'aws-signature';

const encoded = encodeRfc3986('Live long and prosper. 🖖');
const digest = sha256('request data', 'hex');
const mac = hmacSha256('secret key', 'request data', 'base64');
```

`sha256` and `hmacSha256` return a `Buffer` by default. Pass `'hex'` or `'base64'` to request a string representation.

`encodeRfc3986` percent-encodes a string using the RFC 3986 unreserved character set.
