export type RequestConfig = {
    /**
     * URL object or string for this request.
     */
    url: string | URL;

    /**
     * Http method, defaults to 'GET'.
     */
    method?: string;

    /**
     * Additional headers to send.
     */
    headers?: [string, string][] | Record<string, string> | Headers;

    /**
     * Hash of the payload which is sent with the request.
     * The hash must be hex-encoded sha256.
     * 
     * Defaults to the string 'UNSIGNED-PAYLOAD'.
     */
    contentHash?: string;
}

export type Credentials = {
    /**
     * AWS access key ID.
     */
    accessKeyId: string;

    /**
     * AWS secret access key. Required for signing a request.
     */
    secretAccessKey?: string;

    /**
     * A security or session token to use with these credentials. Usually
     * present for temporary credentials.
     */
    sessionToken?: string;
}

export type SignOptions = {
    /**
     * The AWS credentials to use when signing requests.
     */
    credentials: Credentials;

    /**
     * The date and time to be used as signature metadata. This value should be
     * a Date object or a string that can be understood by the JavaScript
     * `Date` constructor.
     *
     * Defaults to the current time.
     */
    date?: string | Date;

    /**
     * The region name.
     *
     * Parsed from the endpoint if it is '[service].[region].amazonaws.com',
     * otherwise defaults to 'auto'.
     */
    region?: string;

    /**
     * The service signing name.
     *
     * Parsed from the endpoint if it is '[service].[region].amazonaws.com',
     * otherwise defaults to 's3'.
     */
    service?: string;

    /**
     * How long the signed request remains valid in seconds.
     * Only used if `signQuery` is true.
     *
     * Defaults to 3600 seconds (1 hour).
     */
    expires?: number;

    /**
     * a list of header names to include in the canonical request.
     */
    signableHeaders?: string[];

    /**
     * to sign the query instead of adding an Authorization header.
     */
    signQuery?: boolean;
}
