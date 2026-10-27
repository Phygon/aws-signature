import type { RequestConfig } from "./types.ts";
import { HEADER_HOST, UNSIGNED_PAYLOAD } from "./constants.ts";

/**
 * Represents a HTTP request to an AWS service.
 * Use RequestSigner to add signature headers.
 * 
 * @example
 * const req = new SignableRequest({
 *   url: 'https://bucket-name.s3.eu-west-1.amazonaws.com/file.txt',
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'text/plain' },
 *   contentHash: sha256(payload, 'hex')
 * });
 * // ... signing ...
 * const response = await fetch(req.url, { ...req.requestInit(), body: payload });
 */
export default class SignableRequest {
    readonly url: URL;
    readonly method: string;
    readonly headers: Headers;
    readonly contentHash: string;

    constructor(config: RequestConfig) {
        this.url = new URL(config.url);
        this.method = config.method || 'GET';
        this.headers = new Headers(config.headers);
        this.contentHash = config.contentHash ?? UNSIGNED_PAYLOAD;

        if (!this.headers.has(HEADER_HOST)) {
            this.headers.set(HEADER_HOST, this.url.host);
        }
    }

    requestInit(): {
        method: string;
        headers: Headers;
    } {
        return {
            method: this.method,
            headers: this.headers,
        };
    }
}
