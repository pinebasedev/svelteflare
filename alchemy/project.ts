import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The one place this repo's Cloudflare-side names come from. `APP` is the root
 * `package.json` `name`, so a project created from the template sets it once
 * there and every Worker, stack, and token name follows. Renaming the GitHub
 * repo changes nothing. Changing `APP` on a deployed project starts a new stack
 * and leaves the old one running, so treat it as fixed after the first deploy.
 *
 * Only Node built-ins are imported, so `scripts/bootstrap-github.mjs` can load
 * it with Node's built-in type stripping.
 */

/** The template's own name. Deploys refuse to run under it (`assertNotTemplate`). */
export const TEMPLATE_APP = 'svelteflare';

const packageName: unknown = JSON.parse(
  readFileSync(fileURLToPath(import.meta.resolve('../package.json')), 'utf8')
).name;

/**
 * `packageName` as a Cloudflare name: lowercase letters, digits, and single
 * dashes. At most 40 characters, so the longest Worker name
 * (`<app>-marketing-pr-<number>`) stays under Cloudflare's 63.
 */
export const APP = (() => {
  const name = String(packageName ?? '')
    .replace(/^@[^/]+\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!/^[a-z]/.test(name) || name.length > 40) {
    throw new Error(
      'package.json "name" must start with a letter and be at most 40 characters as a ' +
        `Cloudflare name (got "${name}").`
    );
  }
  return name;
})();

/**
 * Deploys, and the bootstrap that mints deploy credentials, run only in a
 * project made from the template, never in the template itself.
 */
export const assertNotTemplate = (): void => {
  if (APP === TEMPLATE_APP) {
    throw new Error(
      `This is the ${TEMPLATE_APP} template. Set "name" in the root package.json to your ` +
        "project's name before deploying: every Cloudflare resource is named after it."
    );
  }
};

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
