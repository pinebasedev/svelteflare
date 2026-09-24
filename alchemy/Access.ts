import * as Cloudflare from 'alchemy/Cloudflare';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import { STRIPE_WEBHOOK_PATH } from '../apps/api/src/helpers/stripe.ts';
import { APP } from './project.ts';

/**
 * Cloudflare Access for the review stages (`pr-*` and `staging`); `prod` is
 * public. One application per stage, which the web app, the API, and the
 * marketing site all enroll into (their `access` prop), so one login covers
 * every hostname.
 *
 * The web app calls the API cross-origin, which Access only allows with:
 *   - `eagerRedirectCookieSetting`: right after login, Access sets its cookie
 *     on every hostname in the application, so the API host has one before the
 *     SPA's first call.
 *   - `optionsPreflightBypass`: browsers send CORS preflights without cookies;
 *     these go straight to the API, whose CORS middleware answers them.
 *   - `sameSiteCookieAttribute: 'lax'`: web and API are the same site, since
 *     `workers.dev` is a public suffix and both hosts share
 *     `<account>.workers.dev` (and the parent domain with custom domains).
 * The API also verifies the Access JWT itself (`CF_ACCESS_AUD`, see
 * `apps/api/src/middleware/access-jwt.ts`).
 *
 * These three props come from `patches/alchemy@2.0.0-beta.79.patch`: Alchemy
 * doesn't expose them yet. Drop the patch once it does.
 *
 * Required on a review-stage deploy (no fallbacks: a placeholder would stand up
 * a gate nobody can log in to):
 *   - `CF_ACCESS_ALLOW_EMAIL`: who may log in, comma-separated.
 *   - `CF_GOOGLE_IDP_ID`: the Zero Trust org's Google identity provider.
 *   - `CF_ACCESS_TEAM_DOMAIN`: the Zero Trust team name (`<team>.cloudflareaccess.com`).
 */
export const ReviewAccess = (stage: string) =>
  Effect.gen(function* () {
    const allowEmail = yield* Config.String('CF_ACCESS_ALLOW_EMAIL');
    const googleIdpId = yield* Config.String('CF_GOOGLE_IDP_ID');
    const teamDomain = yield* Config.String('CF_ACCESS_TEAM_DOMAIN');
    const emails = allowEmail
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    const application = yield* Cloudflare.Access.Application('review-access', {
      type: 'self_hosted',
      name: `${APP} ${stage}`,
      policies: [{ decision: 'allow', include: emails.map((email) => ({ email })) }],
      allowedIdps: [googleIdpId],
      autoRedirectToIdentity: true,
      eagerRedirectCookieSetting: true,
      optionsPreflightBypass: true,
      sameSiteCookieAttribute: 'lax',
      httpOnlyCookieAttribute: true
    });

    return { application, teamDomain };
  });

/**
 * Lets Stripe's webhook calls through to a gated API: Stripe can't log in to
 * Access or send custom headers. Scoped to exactly the webhook path, which
 * Access matches before the Worker-level application above. The endpoint stays
 * protected by Stripe's signature, which better-auth verifies on every call
 * against `STRIPE_WEBHOOK_SECRET`. The API's own Access check skips this path
 * too (`apps/api/src/middleware/access-jwt.ts`).
 */
export const StripeWebhookBypass = (stage: string, apiUrl: string) =>
  Cloudflare.Access.Application('stripe-webhook-bypass', {
    type: 'self_hosted',
    name: `${APP} ${stage} Stripe webhook`,
    destinations: [{ type: 'public', uri: `${new URL(apiUrl).host}${STRIPE_WEBHOOK_PATH}` }],
    policies: [{ decision: 'bypass', include: ['everyone'] }]
  });

export type ReviewAccess = Effect.Success<ReturnType<typeof ReviewAccess>>;
