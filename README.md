# Svelteflare

A production-ready SvelteKit + Cloudflare SaaS boilerplate. Clone it, rename it, ship it.

## What's inside

- **Auth that just works** — email + password with OTP verification, Google OAuth, and password reset via [Better Auth](https://better-auth.com)
- **Stripe subscriptions** — plans, checkout, webhooks, and entitlement checks; gate any route or feature on an active subscription
- **57-component UI kit** — a themed [shadcn-svelte](https://shadcn-svelte.com) library (`@repo/ui`) with semantic tokens and automatic dark mode
- **Typed end to end** — the SvelteKit client consumes the Hono API through a typed RPC client; rename a field on the server and the frontend fails to compile
- **Hardened API** — CORS, CSRF protection, rate limiting, secure headers, request timeouts, and structured errors as middleware on every request
- **Cloudflare-native** — Workers, D1 (SQLite), and Cloudflare Email; no servers to manage and a generous free tier

## Stack

| Layer     | Tech                                              |
| --------- | ------------------------------------------------- |
| Frontend  | Svelte 5 (runes), SvelteKit (static SPA)          |
| API       | Hono on Cloudflare Workers                        |
| Auth      | Better Auth (email OTP, Google OAuth, Stripe)     |
| Database  | Drizzle ORM + Cloudflare D1                       |
| Billing   | Stripe subscriptions                              |
| Styling   | Tailwind v4 + shadcn-svelte with semantic tokens  |
| Monorepo  | pnpm workspaces + Turborepo + just                |

## Monorepo layout

```
apps/
  web/         SvelteKit SPA — the app template (search-and-replace "YourApp")
  api/         Hono Cloudflare Worker — auth, database, billing
  marketing/   This project's one-page site — delete or repurpose for your product
packages/
  ui/          Theme + component library (@repo/ui) — single source of truth for looks
  eslint-config/, typescript-config/
```

## Quick start

Requires [Node 24+](https://nodejs.org), [pnpm](https://pnpm.io), and [just](https://github.com/casey/just).

```sh
git clone https://github.com/pinebasedev/svelteflare.git my-app
cd my-app
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.dev.vars.example apps/api/.dev.vars
just migrate-local   # create the local D1 database
just dev             # marketing on :9001, web on :9002, api on :9003
```

Fill in `apps/web/.env` for local dev:

```sh
PUBLIC_APP_URL=http://localhost:9002
PUBLIC_API_URL=http://localhost:9003
PUBLIC_BETTER_AUTH_URL=http://localhost:9003
PUBLIC_GOOGLE_CLIENT_ID=   # only needed for Google login
```

Secrets in `apps/api/.dev.vars` (`BETTER_AUTH_SECRET` is required; Stripe and Google keys are only needed when you want billing and social login):

```sh
BETTER_AUTH_SECRET=   # openssl rand -base64 32
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Commands

```sh
just dev              # all dev servers
just check            # typecheck everything
just lint             # ESLint + Prettier
just migrate-local    # apply D1 migrations locally
just generate         # generate migrations from the Drizzle schema
just studio           # Drizzle Studio
pnpm --filter @repo/api test
```

Run `just` with no arguments to see every recipe.

## Theming

The entire theme lives in `packages/ui/src/global.css` as CSS variables. Feature code only ever uses semantic classes (`bg-background`, `text-muted-foreground`, `bg-primary`, …) — a lint rule enforces this — so swapping the token values restyles all 57 components, light and dark mode, at once.

## Deploying

Each app is a Cloudflare Worker. After `wrangler login`:

```sh
just migrate-staging
just deploy-api-staging
just deploy-web-staging
just deploy-marketing-staging
```

Production equivalents: `just deploy-*-production`. Set the API secrets with `wrangler secret put` and adjust the domains in each app's `wrangler.jsonc`.

## License

[MIT](LICENSE)
