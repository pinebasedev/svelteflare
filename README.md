# Svelteflare

A production-ready SvelteKit + Cloudflare SaaS boilerplate and starter kit. Clone it, rename it, ship it.

**[svelteflare.com](https://svelteflare.com)** · [github.com/pinebasedev/svelteflare](https://github.com/pinebasedev/svelteflare) · MIT licensed

Svelteflare gives you a working SaaS skeleton — auth, subscriptions, a themed UI kit, and a typed API — on infrastructure that scales to zero and costs nothing until you have real users. You bring the product; the account system, billing, and deployment plumbing are already wired together and tested.

## Who this is for

You're comfortable with Svelte/TypeScript and want to skip the two weeks of boilerplate every SaaS needs before you can build the feature you actually care about: user accounts, subscriptions, a component library, and a deploy pipeline. If you'd rather review working code than read a tutorial, start with `apps/web/src/routes` after the quick start below.

## What's inside

- **Auth that just works** — email + password with OTP verification, Google OAuth, and password reset via [Better Auth](https://better-auth.com)
- **Stripe subscriptions** — plans, checkout, webhooks, and entitlement checks; gate any route or feature on an active subscription
- **56-component UI kit** — a themed [shadcn-svelte](https://shadcn-svelte.com) library (`@repo/ui`) with semantic tokens and automatic dark mode
- **Typed end to end** — the SvelteKit client consumes the Hono API through a typed RPC client; rename a field on the server and the frontend fails to compile
- **Hardened API** — CORS, CSRF protection, rate limiting, secure headers, request timeouts, and structured errors as middleware on every request
- **Cloudflare-native** — Workers, D1 (SQLite), and Cloudflare Email; no servers to manage and a generous free tier
- **Static marketing site** — a prerendered one-pager (`apps/marketing`) built from the same `@repo/ui` kit, ready to swap in your own copy

## Stack

| Layer    | Tech                                                                  |
| -------- | --------------------------------------------------------------------- |
| Frontend | Svelte 5 (runes), SvelteKit (static SPA + prerendered marketing site) |
| API      | Hono on Cloudflare Workers                                            |
| Auth     | Better Auth (email OTP, Google OAuth, Stripe plugin)                  |
| Database | Drizzle ORM + Cloudflare D1                                           |
| Billing  | Stripe subscriptions                                                  |
| Styling  | Tailwind v4 + shadcn-svelte with semantic tokens                      |
| Monorepo | pnpm workspaces + Turborepo + just                                    |

## Monorepo layout

```
apps/
  web/         SvelteKit SPA — the app template (search-and-replace "Demo App")
  api/         Hono Cloudflare Worker — auth, database, billing
  marketing/   Static, prerendered marketing site — delete or repurpose for your product
packages/
  ui/                  Theme + component library (@repo/ui) — single source of truth for how things look
  eslint-config/       Shared ESLint rules, including the theme/color-token lint rule
  typescript-config/   Shared tsconfig bases for Svelte apps and the Worker
```

## Requirements

- [Node 24](https://nodejs.org) (see `.nvmrc`)
- [pnpm](https://pnpm.io) — the exact version is pinned via `packageManager` and Corepack
- [just](https://github.com/casey/just) — task runner used for all common commands
- A [Cloudflare](https://dash.cloudflare.com) account (free tier is enough) once you're ready to deploy

## Quick start

```sh
git clone https://github.com/pinebasedev/svelteflare.git my-app
cd my-app
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.dev.vars.example apps/api/.dev.vars
just migrate-local   # create the local D1 database
just dev             # marketing on :9001, web on :9002, api on :9003
```

`apps/marketing` needs no configuration to run locally — it's a static site with no auth or API calls.

### `apps/web/.env`

```sh
PUBLIC_APP_URL=http://localhost:9002
PUBLIC_API_URL=http://localhost:9003
PUBLIC_BETTER_AUTH_URL=http://localhost:9003
PUBLIC_GOOGLE_CLIENT_ID=   # only needed for "Sign in with Google"
```

### `apps/api/.dev.vars`

```sh
BETTER_AUTH_SECRET=     # required — generate with: openssl rand -base64 32
GOOGLE_CLIENT_SECRET=   # only needed for "Sign in with Google"
STRIPE_SECRET_KEY=      # only needed for billing
STRIPE_WEBHOOK_SECRET=  # only needed for billing
```

You can run `just dev` with only `BETTER_AUTH_SECRET` set — Google login and billing are optional and can be added later without touching any other config.

## Commands

Run `just` with no arguments to see every recipe, grouped. The most common ones:

```sh
just dev               # run all three apps together (web, api, marketing)
just dev-web           # run a single app
just check             # typecheck everything
just lint              # ESLint + Prettier
just format            # auto-format with Prettier

just migrate-local     # apply D1 migrations to your local database
just generate          # generate a new migration from the Drizzle schema
just studio            # open Drizzle Studio against the local DB

pnpm --filter @repo/api test   # run the API's Vitest suite
```

Build and deploy recipes follow the same `<action>-<app>-<environment>` shape, e.g. `just build-web`, `just deploy-api-staging`, `just deploy-marketing-production` — see the [Deploying](#deploying) section below.

## Theming

The theme is the combination of semantic variables in `packages/ui/src/global.css` and the visual implementations in `packages/ui/src/components`. Feature code uses semantic classes (`bg-background`, `text-muted-foreground`, `bg-primary`, …), while a Custom design may also change component shape, spacing, borders, shadows, typography, and interaction treatment without changing component APIs or behavior. Design review happens in the actual locally running product, using its real features and surfaces. See `.agents/skills/ui-and-theme` for the full contract.

## Deploying

Each app is a separate Cloudflare Worker. After `wrangler login`:

```sh
just migrate-staging
just deploy-api-staging
just deploy-web-staging
just deploy-marketing-staging
```

Production equivalents: `just deploy-*-production` (e.g. `just deploy-api-production`). Set the API's secrets with `wrangler secret put <NAME> --env <staging|production>`, and update the custom domains in each app's `wrangler.jsonc` before going live.

## Working with an AI coding agent

If you're extending this repo with Claude Code or a similar tool, read `AGENTS.md` first — it covers the non-negotiable theming rules — and the guides in `.agents/skills/` for feature work, forms, and auth/billing patterns.

## About

Svelteflare is an open-source project maintained by [Pinebase](https://github.com/pinebasedev). It exists so developers don't have to rebuild auth, billing, and UI infrastructure from scratch for every new SaaS idea — clone it, make it yours, and spend your time on the product instead.

Questions or ideas? Open an issue on [GitHub](https://github.com/pinebasedev/svelteflare/issues).

## License

[MIT](LICENSE)
