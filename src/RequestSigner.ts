import * as C from './constants.ts';
import CanonicalRequest from './CanonicalRequest.ts';
import type SignableRequest from './SignableRequest.ts';
import type { Credentials, SignOptions } from './types.ts';
import { getDateTime, hmacSha256, sha256 } from './utils.ts';
import { getSigningKey } from './signing-key.ts';

/**
 * Signs HTTP requests using AWS Signature Version 4.
 *
 * Supports both authorization headers and presigned query parameters.
 */
export default class RequestSigner {
    readonly request: SignableRequest;
    // credentials and scope
    readonly credentials: Credentials;
    readonly scope;
    // extra sign parameters
    readonly expires: number;
    readonly signableHeaders: Set<string>;  // must be lowercase
    readonly signQuery: boolean;
    // state
    private prepared = false;

    /**
     * Initializes a signer for the request and configures its signing scope.
     * The service and region are inferred from the host unless explicitly provided.
     *
     * @param request Request to sign.
     * @param options Credentials and signing options.
     */
    constructor(request: SignableRequest, options: SignOptions) {
        const [_bucket, service, region] = this.matchHost(request.url.host);
        const datetime = getDateTime(options.date ?? new Date());

        this.request = request;

        this.credentials = options.credentials;
        this.scope = {
            datetime,
            region: options.region ?? region,
            service: options.service ?? service
        };

        this.expires = options.expires ?? 3600;
        this.signableHeaders = new Set(options.signableHeaders?.map((name) => name.toLowerCase()));
        this.signQuery = options.signQuery ?? false;
    }

    /**
     * Prepares the request for signing, by adding the required signing
     * parameters to the query string or to the headers.
     */
    prepareRequest() {
        if (this.prepared) return;
        this.prepared = true;

        if (this.signQuery) {
            this.prepareQueries();
        } else {
            this.prepareHeaders();
        }
    }

    /** Builds the canonical request and string to sign. */
    prepareSignature() {
        this.prepareRequest();
        const canonicalRequest = new CanonicalRequest(this.request, this.signableHeaders).toString();
        const stringToSign = this.stringToSign(canonicalRequest);

        return {
            canonicalRequest,
            stringToSign
        };
    }

    /**
     * Signs the request.
     * Returns the finished request as convenience.
     */
    sign() {
        const { stringToSign } = this.prepareSignature();
        const signature = this.createSignature(stringToSign);
        return this.addSignature(signature);
    }

    /**
     * Adds a signature to the request.
     * Returns the finished request as convenience.
     */
    addSignature(signature: string) {
        if (this.signQuery) {
            this.request.url.searchParams.set(C.HEADER_AMZ_SIGNATURE, signature);
        } else {
            const { signedHeaders } = CanonicalRequest.canonicalizeHeaders(this.request.headers, this.signableHeaders);

            this.request.headers.set(C.HEADER_AUTHORIZATION, [
                `${C.AWS_ALGORITHM} Credential=${this.credentials.accessKeyId}/${this.credentialScope()}`,
                `SignedHeaders=${signedHeaders}`,
                `Signature=${signature}`,
            ].join(', '));
        }
        return this.request;
    }

    /**
     * Creates a signature string.
     * Use `prepareSignature()` to retrieve `stringToSign`.
     */
    createSignature(stringToSign: string) {
        if (!this.credentials.secretAccessKey) {
            throw new Error('secretAccessKey is required to derive a signing key');
        }

        const { datetime, region, service } = this.scope;
        const shortDate = datetime.slice(0, 8);
        const signingKey = getSigningKey(this.credentials.secretAccessKey, shortDate, region, service);

        return hmacSha256(signingKey, stringToSign, 'hex');
    }

    /** Creates the AWS string to sign. */
    stringToSign(canonicalRequest: string) {
        return [
            C.AWS_ALGORITHM,
            this.scope.datetime,
            this.credentialScope(),
            sha256(canonicalRequest, 'hex')
        ].join('\n');
    }

    /** Builds the credential scope for the request. */
    private credentialScope() {
        const { datetime, region, service } = this.scope;
        return `${datetime.slice(0, 8)}/${region}/${service}/aws4_request`;
    }

    /** Extracts the signing service and region from a host name. */
    private matchHost(host: string) {
        const match = host.match(/(?:([^\.]{0,63})\.)?([^\.]{1,63})\.([^\.]{1,63})\.amazonaws\.com(\.cn)?$/);
        if (match) {
            // bucket (optional), service, region
            return match.slice(1, 4);
        } else {
            // for non-amazon endpoints, we default to service='s3' and region='auto'
            return ['', 's3', 'auto'];
        }
    }

    /** Adds signing parameters to the query string. */
    private prepareQueries() {
        const { searchParams } = this.request.url;
        const { signedHeaders } = CanonicalRequest.canonicalizeHeaders(this.request.headers, this.signableHeaders);

        searchParams.set(C.HEADER_AMZ_DATE, this.scope.datetime);
        searchParams.set(C.HEADER_AMZ_EXPIRES, String(this.expires));

        searchParams.set(C.HEADER_AMZ_ALGORITHM, C.AWS_ALGORITHM);
        searchParams.set(C.HEADER_AMZ_CREDENTIAL, `${this.credentials.accessKeyId}/${this.credentialScope()}`);
        searchParams.set(C.HEADER_AMZ_SIGNEDHEADERS, signedHeaders);

        if (this.credentials.sessionToken) {
            searchParams.set(C.HEADER_AMZ_SECURITY_TOKEN, this.credentials.sessionToken);
        }
    }

    /** Adds signing parameters to the request headers. */
    private prepareHeaders() {
        const { headers } = this.request;
        headers.set(C.HEADER_AMZ_DATE, this.scope.datetime);

        // if (!headers.has(C.HEADER_AMZ_CONTENT_SHA256)) {
        //     headers.set(C.HEADER_AMZ_CONTENT_SHA256, this.request.contentHash);
        // }

        if (this.credentials.sessionToken) {
            headers.set(C.HEADER_AMZ_SECURITY_TOKEN, this.credentials.sessionToken);
        }
    }
}
