import type SignableRequest from './SignableRequest.ts';
import { comparePair, encodeRfc3986 } from './utils.ts';
import { HEADER_HOST } from './constants.ts';

/**
 * Holds the canonical components of a signable HTTP request.
 *
 * The components are derived from a `SignableRequest` and can be joined
 * to a canonical request string with `toString()`.
 */
export default class CanonicalRequest {
    readonly method: string;
    readonly pathname: string;
    readonly canonicalQuery: string;
    readonly canonicalHeaders: string;
    readonly signedHeaders: string;
    readonly contentHash: string;

    /**
     * Creates a canonical representation of a signable HTTP request.
     *
     * @param request - The request whose components will be canonicalized.
     * @param signableHeaders - Optional additional header names to include in
     *   the signature. Names should be lowercase to match the normalized names
     *   used during selection.
     */
    constructor(request: SignableRequest, signableHeaders?: Set<string>) {
        const { canonicalHeaders, signedHeaders } = CanonicalRequest.canonicalizeHeaders(
            request.headers,
            signableHeaders,
        );

        this.method = request.method;
        this.pathname = request.url.pathname;
        this.canonicalQuery = CanonicalRequest.canonicalizeQuery(request.url.searchParams);
        this.canonicalHeaders = canonicalHeaders;
        this.signedHeaders = signedHeaders;
        this.contentHash = request.contentHash;
    }

    /**
     * Builds the canonical and signed-header strings.
     * Always signs Host and x-amz-* headers, plus any explicitly requested headers.
     */
    static canonicalizeHeaders(headers: Headers, signableHeaders?: Set<string>): {
        canonicalHeaders: string;
        signedHeaders: string;
    } {
        const pairs = headers.entries().toArray()
            .map(([name, value]): [string, string] =>
                [name.toLowerCase(), value.trim().replace(/\s+/g, ' ').replace(/, /g, ',')]
            )
            .filter(([name]) =>
                name === HEADER_HOST || name.startsWith('x-amz-') || signableHeaders?.has(name)
            )
            .sort(comparePair);

        return {
            canonicalHeaders: pairs.map(([name, value]) => `${name}:${value}`).join('\n') + '\n',
            signedHeaders: pairs.map(([name]) => name).join(';'),
        };
    }

    /** Encodes and sorts the query entries to produce a canonical query string. */
    static canonicalizeQuery(query: URLSearchParams): string {
        return query.entries().toArray()
            .map(([key, value]): [string, string] =>
                [encodeRfc3986(key), encodeRfc3986(value)]
            )
            .sort(comparePair)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
    }

    /** Assembles the canonical request string from its canonical components. */
    toString(): string {
        return [
            this.method,
            this.pathname,
            this.canonicalQuery,
            this.canonicalHeaders,
            this.signedHeaders,
            this.contentHash,
        ].join('\n'); 
    }
}
