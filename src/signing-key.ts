import SimpleLruCache from './SimpleLruCache.ts';
import { hmacSha256 } from './utils.ts';

const SIGNING_KEY_CACHE_SIZE = 16;
const signingKeyCache = new SimpleLruCache<string, Buffer>(SIGNING_KEY_CACHE_SIZE);

/**
 * Derive a signing key from its composite parts.
 *
 * @param secretAccessKey - the secret key with which the request will be signed
 * @param shortDate - the current calendar date in the form YYYYMMDD
 * @param region - the AWS region in which the service resides
 * @param service - the service to which the signed request is being sent
 */
export function getSigningKey(
    secretAccessKey: string,
    shortDate: string,
    region: string,
    service: string,
): Buffer {
    const cacheKey = [secretAccessKey, shortDate, region, service].join('/');

    return signingKeyCache.getOrCreate(cacheKey, () => {
        const dateKey = hmacSha256(`AWS4${secretAccessKey}`, shortDate);
        const regionKey = hmacSha256(dateKey, region);
        const serviceKey = hmacSha256(regionKey, service);
        return hmacSha256(serviceKey, 'aws4_request');
    });
}
