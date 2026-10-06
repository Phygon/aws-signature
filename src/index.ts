// Export main classes and utility functions
export { default as CanonicalRequest } from './CanonicalRequest.ts';
export { default as RequestSigner } from './RequestSigner.ts';
export { default as SignableRequest } from './SignableRequest.ts';
export { getSignedUrl, prepareRequest } from './request-signing.ts';
export { getSigningKey } from './signing-key.ts';

// Export utilities
export {
    encodeRfc3986,
    hmacSha256,
    sha256
} from './utils.js';

// Re-export types
export type {
    Credentials,
    RequestConfig,
    SignOptions
} from './types.js';
