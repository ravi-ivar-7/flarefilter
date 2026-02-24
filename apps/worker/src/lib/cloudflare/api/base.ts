export class CloudflareApiBase {
    constructor(
        protected cfAccountId: string,
        protected cfApiToken: string
    ) { }

    /**
     * Executes a GraphQL POST request to the Cloudflare Analytics endpoint.
     */
    protected async fetchGraphQL(query: string, variables: any) {
        const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.cfApiToken}`,
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudflare GraphQL API Error (${response.status}): ${errorText}`);
        }

        const payload: any = await response.json();
        if (payload.errors?.length > 0) {
            throw new Error(`GraphQL Execution Errors: ${JSON.stringify(payload.errors)}`);
        }

        return payload.data;
    }

    /**
     * Executes a standard REST request against the Cloudflare API.
     */
    protected async fetchRest(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.cfApiToken}`,
            },
        });

        // Check ok BEFORE .json() — a non-JSON body (e.g. 502 HTML from a
        // gateway in front of CF) would throw an unhandled parse error otherwise.
        if (!response.ok) {
            let detail: string;
            try {
                const err: any = await response.json();
                detail = JSON.stringify(err.errors ?? err);
            } catch {
                detail = await response.text();
            }
            throw new Error(`Cloudflare REST API Error (${response.status}): ${detail}`);
        }

        const payload: any = await response.json();

        if (!payload.success) {
            throw new Error(`Cloudflare REST API Error: ${JSON.stringify(payload.errors)}`);
        }

        return payload.result;
    }
}
