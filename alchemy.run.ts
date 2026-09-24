import * as Alchemy from 'alchemy';
import { ALCHEMY_DEV, Stage } from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as GitHub from 'alchemy/GitHub';
import * as Stripe from 'alchemy/Stripe';
import * as Output from 'alchemy/Output';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

import { ReviewAccess, StripeWebhookBypass } from './alchemy/Access.ts';
import { Api } from './alchemy/Api.ts';
import { stringOr } from './alchemy/config.ts';
import { Database } from './alchemy/Db.ts';
import { STACK, workersDevOrigin } from './alchemy/project.ts';
import { Storage } from './alchemy/Storage.ts';
import { StripeWebhook } from './alchemy/Stripe.ts';
import { Marketing, Web } from './alchemy/Web.ts';

/**
 * Svelteflare's infrastructure, one Alchemy stage per environment, deployed
 * from GitHub Actions (`.github/workflows/`):
 *
 *   - `pr-{number}`: one per open PR, destroyed when it closes
 *   - `staging`: redeployed on every merge into `staging`
 *   - `prod`: redeployed on every merge into `main`
 *
 * `pr-*` and `staging` sit behind Cloudflare Access (`alchemy/Access.ts`):
 * web app, API, and marketing site alike. `prod` is public.
 *
 * `alchemy dev` runs everything locally: the API in workerd on :9003 with
 * local D1, R2, and email simulators, and the web app and marketing site through their
 * own Vite dev servers on :9002 and :9001.
 *
 * State: the local filesystem for `alchemy dev` and hand deploys; Cloudflare's
 * remote state store in CI, whose runners keep no files between runs.
 */
// Alchemy's Stripe provider demands credentials as soon as it's loaded: a
// `STRIPE_API_KEY` or a Stripe profile. Load it only when there's a key (in the
// environment or the root `.env`, the two places Alchemy's config reads), so
// `pnpm dev` keeps working for anyone not using Stripe.
const hasStripeKey = (): boolean => {
  if (process.env.STRIPE_API_KEY) return true;
  try {
    return Boolean(parseEnv(readFileSync('.env', 'utf8')).STRIPE_API_KEY);
  } catch {
    return false;
  }
};

export default Alchemy.Stack(
  STACK,
  {
    providers: hasStripeKey()
      ? Layer.mergeAll(Cloudflare.providers(), GitHub.providers(), Stripe.providers())
      : Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    state: process.env.CI ? Cloudflare.state() : Alchemy.localState()
  },
  Effect.gen(function* () {
    const stage = yield* Stage;
    const dev = yield* ALCHEMY_DEV;
    const isProd = stage === 'prod';
    const isReview = stage === 'staging' || stage.startsWith('pr-');
    // One Access application for the stage; web, API, and marketing all enroll.
    const access = isReview && !dev ? yield* ReviewAccess(stage) : undefined;

    // Custom domains are prod-only and optional; without them prod runs on
    // workers.dev like every other stage.
    const domains = isProd
      ? {
          api: yield* stringOr('PROD_API_DOMAIN', ''),
          app: yield* stringOr('PROD_APP_DOMAIN', ''),
          marketing: yield* stringOr('PROD_MARKETING_DOMAIN', '')
        }
      : { api: '', app: '', marketing: '' };
    if (Boolean(domains.api) !== Boolean(domains.app)) {
      return yield* Effect.die(
        new Error('Set PROD_API_DOMAIN and PROD_APP_DOMAIN together, or neither.')
      );
    }

    const urls = dev
      ? { api: 'http://localhost:9003', app: 'http://localhost:9002' }
      : domains.api
        ? { api: `https://${domains.api}`, app: `https://${domains.app}` }
        : yield* Effect.gen(function* () {
            // Also read by Alchemy itself when it builds each Worker's URL, so
            // the two always agree.
            const subdomain = yield* Config.String('CLOUDFLARE_WORKERS_SUBDOMAIN');
            return {
              api: workersDevOrigin('api', stage, subdomain),
              app: workersDevOrigin('web', stage, subdomain)
            };
          });

    // Stripe webhooks: registered per stage when Alchemy has a Stripe key
    // (`STRIPE_API_KEY`). Not under `alchemy dev`: Stripe can't reach localhost,
    // so use `stripe listen --forward-to localhost:9003/v1/auth/stripe/webhook`.
    const stripeKey = yield* Config.option(Config.Redacted('STRIPE_API_KEY'));
    const stripeWebhook =
      !dev && Option.isSome(stripeKey) ? yield* StripeWebhook(stage, urls.api) : undefined;
    if (stripeWebhook && access) yield* StripeWebhookBypass(stage, urls.api);

    // Email: Cloudflare Email Service sends to any recipient once the sender's
    // domain is onboarded, whatever hostname the Worker runs on. So every stage
    // with an `EMAIL_FROM_ADDRESS` sends real mail; without one, emails are
    // skipped and logged. `alchemy dev` always gets the simulator (messages land
    // in .alchemy/local/email).
    const configuredFrom = yield* stringOr('EMAIL_FROM_ADDRESS', '');
    const emailFrom = configuredFrom || (dev ? 'hello@example.com' : undefined);

    const database = yield* Database(stage);
    const storage = yield* Storage(stage);

    const api = yield* Api({
      stage,
      dev,
      database,
      storage,
      webOrigin: urls.app,
      domain: domains.api || undefined,
      emailFrom,
      stripeWebhookSecret: stripeWebhook?.secret,
      access
    });
    const web = yield* Web({
      stage,
      appUrl: urls.app,
      apiUrl: urls.api,
      domain: domains.app || undefined,
      access: access?.application
    });
    const marketing = yield* Marketing({
      stage,
      domain: domains.marketing || undefined,
      access: access?.application
    });

    // On a PR build, post (then keep updating) one comment with the preview URLs.
    const github = yield* GitHub.GitHubEnv;
    if (github?.pr) {
      yield* GitHub.Comment('preview-comment', {
        owner: github.owner,
        repository: github.repository,
        issueNumber: github.pr,
        body: Output.interpolate`
          ## Preview environment

          | | |
          |---|---|
          | **Web app** | ${web.url} |
          | **API** | ${api.url} |
          | **Marketing** | ${marketing.url} |
          | **Stage** | \`${stage}\` |
          | **Commit** | \`${github.sha.slice(0, 7)}\` |

          _Updates on every push; torn down when this PR closes._
        `
      });
    }

    return {
      webUrl: web.url,
      apiUrl: api.url,
      marketingUrl: marketing.url,
      databaseName: database.databaseName
    };
  })
);
