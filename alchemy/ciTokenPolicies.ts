import type { Policy } from 'alchemy/Cloudflare/ApiToken';

/**
 * What the CI token (minted by `alchemy/github.ts`) may do: exactly what
 * `alchemy.run.ts` deploys on `workers.dev`, and nothing broader.
 *
 * Custom domains (`PROD_*_DOMAIN`) need zone-level permissions on top
 * ("Workers Routes Write" and "DNS Write" on that zone). Add a second policy
 * scoped to the zone before turning them on.
 */
export function ciTokenPolicies(accountId: string): Policy[] {
  return [
    {
      effect: 'allow',
      permissionGroups: [
        'Workers Scripts Write',
        'D1 Write',
        'Workers R2 Storage Write',
        // Access: Apps and Policies Write, for the review-stage gate
        // (`alchemy/Access.ts`). By explicit id: Alchemy's name lookup picks the
        // same-named zone permission, which grants nothing on an account.
        { id: '1e13c5124ca64b72b1969a67e8829049' },
        // The gate's `allowedIdps` reference is resolved against the account's
        // identity providers; without read access the same step 403s.
        'Access: Organizations, Identity Providers, and Groups Read',
        // Not for this repo's resources: Alchemy's remote state store (CI only)
        // keeps its auth token and encryption key in the account's Secrets Store.
        'Secrets Store Write'
      ],
      resources: { [`com.cloudflare.api.account.${accountId}`]: '*' }
    }
  ];
}
