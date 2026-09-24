import * as Cloudflare from 'alchemy/Cloudflare';
import { stringOr } from './config.ts';
import { workerName } from './project.ts';

type Access = Cloudflare.Access.Application;

// Both sites import `@repo/ui` from source, so its changes must rebuild them
// too. `include` replaces the default memo scope, hence `lockfile: true`.
const memo = {
  include: ['**/*', '../../packages/ui/src/**', '../../packages/ui/package.json'],
  lockfile: true
};

export type WebOptions = {
  stage: string;
  /** The web app's own origin (`PUBLIC_APP_URL`: auth redirects, canonical links). */
  appUrl: string;
  /** The API's origin (`PUBLIC_API_URL`), baked into the bundle at build time. */
  apiUrl: string;
  domain?: string;
  access?: Access;
};

/**
 * The `apps/web` SPA (adapter-static → `dist/`) as an assets-only Worker.
 *
 * `$env/static/public` is read at build time, so the stage's URLs go in through
 * `env`, which Alchemy passes to the build (and dev) command. Under `alchemy
 * dev` the build is skipped and `pnpm dev` (Vite, http://localhost:9002) runs
 * instead.
 *
 * Not `Cloudflare.Website.SvelteKit`: in Alchemy 2.0.0-beta.79 it needs
 * SvelteKit 3 and refuses a project with a `svelte.config.js`.
 */
export const Web = ({ stage, appUrl, apiUrl, domain, access }: WebOptions) =>
  Cloudflare.Website.StaticSite('web', {
    name: workerName('web', stage),
    cwd: './apps/web',
    command: 'pnpm build',
    outdir: 'dist',
    memo,
    assets: { notFoundHandling: 'single-page-application' },
    dev: { command: 'pnpm dev' },
    ...(domain ? { domain } : {}),
    ...(access ? { access } : {}),
    env: {
      PUBLIC_APP_URL: appUrl,
      PUBLIC_API_URL: apiUrl,
      PUBLIC_BETTER_AUTH_URL: apiUrl,
      PUBLIC_GOOGLE_CLIENT_ID: stringOr('PUBLIC_GOOGLE_CLIENT_ID', '')
    }
  });

/** The `apps/marketing` static site. Under `alchemy dev`: Vite on http://localhost:9001. */
export const Marketing = ({
  stage,
  domain,
  access
}: {
  stage: string;
  domain?: string;
  access?: Access;
}) =>
  Cloudflare.Website.StaticSite('marketing', {
    name: workerName('marketing', stage),
    cwd: './apps/marketing',
    command: 'pnpm build',
    outdir: 'dist',
    memo,
    assets: { notFoundHandling: '404-page' },
    dev: { command: 'pnpm dev' },
    ...(domain ? { domain } : {}),
    ...(access ? { access } : {})
  });
