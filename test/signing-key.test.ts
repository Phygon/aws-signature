import { describe, expect, it } from 'vitest';
import { getSigningKey } from '../src/signing-key.ts';

describe('getSigningKey', () => {
    const inputs = [
        'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY', // secretAccessKey
        '20130524',
        'us-east-1',
        'service',
    ] as const;
    const expectedHex =
        '217e51b7f1c5d7a35e806bc62370a1e3707286d5b26936ded700503cb1f97749';

    it('derives the AWS Signature Version 4 signing key', () => {
        const signingKey = getSigningKey(...inputs);

        expect(signingKey).toBeInstanceOf(Buffer);
        expect(signingKey).toHaveLength(32);
        expect(signingKey.toString('hex')).toBe(expectedHex);
    });

    it('returns the same derived key for the same inputs', () => {
        const first = getSigningKey(...inputs);
        const second = getSigningKey(...inputs);

        expect(second).toEqual(first);
    });
});
