/**
 * The one place this repo's Cloudflare-side names come from. Rename `APP` when
 * you fork the template; every Worker, stack, and token name follows it.
 *
 * Kept free of imports so `scripts/bootstrap-github.mjs` can load it with Node's
 * built-in type stripping.
 */
export const APP = 'svelteflare';

/** The deploy stack (`alchemy.run.ts`). */
export const STACK = APP;

/** The one-time credential bootstrap stack (`alchemy/github.ts`), and its only stage. */
export const BOOTSTRAP_STACK = `${APP}-github`;
export const BOOTSTRAP_STAGE = 'bootstrap';

/** The Cloudflare API token CI deploys with. */
export const CI_TOKEN_NAME = `${APP}-ci`;

type Role = 'api' | 'web' | 'marketing';

/**
 * Worker names are set explicitly, not left to Alchemy, so every stage's URLs
 * are known before anything deploys: the web build needs the API's URL, and
 * the API needs the web app's.
 */
export const workerName = (role: Role, stage: string) => `${APP}-${role}-${stage}`;

/** `https://<worker>.<account-subdomain>.workers.dev`, the URL Alchemy gives the Worker. */
export const workersDevOrigin = (role: Role, stage: string, subdomain: string) =>
  `https://${workerName(role, stage)}.${subdomain}.workers.dev`;
