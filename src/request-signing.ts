import RequestSigner from "./RequestSigner.ts";
import SignableRequest from "./SignableRequest.js";
import type { RequestConfig, SignOptions } from "./types.ts";

/**
 * Creates a signable request and its configured signer.
 * @param request - Request configuration or an existing SignableRequest instance.
 * @param options - Options used to configure signing.
 * @returns The configured request signer.
 */
export function prepareRequest(request: RequestConfig | SignableRequest, options: SignOptions): RequestSigner {
    const req = request instanceof SignableRequest
        ? request
        : new SignableRequest(request);

    const signer = new RequestSigner(req, options);
    return signer;
}

/**
 * Signs a request and returns its URL with signature parameters.
 * @param request - Request configuration or an existing SignableRequest instance.
 * @param options - Signing options; `credentials.secretAccessKey` is required.
 * @returns The signed URL as a string.
 */
export function getSignedUrl(request: RequestConfig | SignableRequest, options: SignOptions): string {
    const signer = prepareRequest(request, { ...options, signQuery: true });
    signer.sign();
    return signer.request.url.toString();
}
