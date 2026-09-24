import * as Cloudflare from 'alchemy/Cloudflare';
import * as Output from 'alchemy/Output';
import * as Config from 'effect/Config';
import type * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';
import type { ReviewAccess } from './Access.ts';
import type { StripeWebhook } from './Stripe.ts';
import { devSecret, optionalSecret, stringOr } from './config.ts';
import { workerName } from './project.ts';

type StripeWebhookSecret = Effect.Success<ReturnType<typeof StripeWebhook>>['secret'];

export type ApiOptions = {
  stage: string;
  /** `alchemy dev`: secrets may fall back to dev-only values. */
  dev: boolean;
  database: Cloudflare.D1.Database;
  storage: Cloudflare.R2.Bucket;
  /** The web app's origin: CORS allowlist and better-auth's trusted origin. */
  webOrigin: string;
  /** Custom domain (prod only). Unset: the Worker's `workers.dev` URL. */
  domain?: string;
  /**
   * Attach the `EMAIL` (`send_email`) binding. Only on a stage whose sender
   * domain has Email Routing; everywhere else `helpers/email.ts` logs and skips.
   */
  sendEmail: boolean;
  /** The stage's Stripe webhook signing secret (`alchemy/Stripe.ts`), when it has one. */
  stripeWebhookSecret?: StripeWebhookSecret;
  /** Review stages: enroll in the stage's Access application and verify its JWT. */
  access?: ReviewAccess;
};

/**
 * The `apps/api` Hono Worker. Its default export is a plain `{ fetch }`
 * handler, so it deploys as an async Worker: Alchemy bundles `main` itself and
 * every binding is declared here. `apps/api/src/types.d.ts` (`AppBindings`)
 * mirrors this `env` by hand; keep the two in sync.
 *
 * Under `alchemy dev` it serves on http://localhost:9003, the port the web
 * app's dev config points at.
 */
export const Api = ({
  stage,
  dev,
  database,
  storage,
  webOrigin,
  domain,
  sendEmail,
  stripeWebhookSecret,
  access
}: ApiOptions) =>
  Cloudflare.Worker('api', {
    name: workerName('api', stage),
    main: './apps/api/src/index.ts',
    compatibility: { flags: ['nodejs_compat'], date: '2026-03-17' },
    observability: { enabled: true },
    dev: { port: 9003, strictPort: true },
    ...(domain ? { domain } : {}),
    ...(access ? { access: access.application } : {}),
    env: {
      DB: database,
      STORAGE: storage,
      FREE_RATE_LIMITER: Cloudflare.RateLimit('FREE_RATE_LIMITER', {
        namespaceId: 1001,
        simple: { limit: 30, period: 60 }
      }),
      PREMIUM_RATE_LIMITER: Cloudflare.RateLimit('PREMIUM_RATE_LIMITER', {
        namespaceId: 1002,
        simple: { limit: 100, period: 60 }
      }),
      ...(sendEmail ? { EMAIL: Cloudflare.Email.SendEmail('EMAIL') } : {}),

      PUBLIC_API_URL: Cloudflare.Worker.URL,
      PUBLIC_BETTER_AUTH_URL: Cloudflare.Worker.URL,
      PUBLIC_ORIGIN_ALLOWLIST: webOrigin,
      PUBLIC_GOOGLE_CLIENT_ID: stringOr('PUBLIC_GOOGLE_CLIENT_ID', ''),
      EMAIL_FROM_ADDRESS: stringOr('EMAIL_FROM_ADDRESS', 'hello@example.com'),
      EMAIL_FROM_NAME: stringOr('EMAIL_FROM_NAME', 'Demo App'),
      ...(access
        ? {
            CF_ACCESS_AUD: access.application.aud,
            CF_ACCESS_TEAM_DOMAIN: access.teamDomain
          }
        : {}),

      // Signs sessions: a deployed stage must never run on the public dev value.
      BETTER_AUTH_SECRET: dev
        ? devSecret('BETTER_AUTH_SECRET')
        : Config.Redacted('BETTER_AUTH_SECRET'),
      GOOGLE_CLIENT_SECRET: optionalSecret('GOOGLE_CLIENT_SECRET'),
      STRIPE_SECRET_KEY: optionalSecret('STRIPE_SECRET_KEY'),
      // Missing only if Alchemy's state lost it (Stripe returns it once): an
      // empty secret makes every webhook fail verification, loudly.
      STRIPE_WEBHOOK_SECRET: stripeWebhookSecret
        ? Output.map(stripeWebhookSecret, (secret) => secret ?? Redacted.make(''))
        : optionalSecret('STRIPE_WEBHOOK_SECRET')
    }
  });
