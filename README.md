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
| Infra    | [Alchemy](https://alchemy.run) (dev, deploy) + GitHub Actions         |
| Monorepo | pnpm workspaces + Turborepo + just                                    |

## Monorepo layout

```
apps/
  web/         SvelteKit SPA — the app template (search-and-replace "Demo App")
  api/         Hono Cloudflare Worker — auth, database, billing
  marketing/   Static, prerendered marketing site — delete or repurpose for your product
alchemy/       Cloudflare resources, one file each; alchemy.run.ts assembles them per stage
packages/
  ui/                  Theme + component library (@repo/ui) — single source of truth for how things look
  lint/                Theme/color-token lint rule, the oxlint plugin, and the Svelte-only ESLint config
  typescript-config/   Shared tsconfig bases for Svelte apps and the Worker
```

## Requirements

- [Node 24](https://nodejs.org) (see `.nvmrc`)
- [pnpm](https://pnpm.io) — the exact version is pinned via `packageManager` and Corepack
- [just](https://github.com/casey/just) — task runner used for all common commands
- A [Cloudflare](https://dash.cloudflare.com) account (free tier is enough). `pnpm dev` runs
  everything locally but needs Alchemy connected to it once: `pnpm alchemy profile edit --add Cloudflare`

## Quick start

```sh
git clone https://github.com/pinebasedev/svelteflare.git my-app
cd my-app
pnpm install
pnpm dev             # marketing on :9001, web on :9002, api on :9003
```

`pnpm dev` is `alchemy dev`: the API runs in workerd with local D1, R2, and email simulators, and the
web app and marketing site run on their own Vite dev servers. It applies the database migrations on
start and needs no configuration. Emails, such as the sign-up verification code, are written to
`.alchemy/local/email/*.eml` instead of being sent.

To turn on Google login or billing, copy `.env.example` to `.env` and fill in `GOOGLE_CLIENT_SECRET`
and `PUBLIC_GOOGLE_CLIENT_ID`, or the `STRIPE_*` keys. Everything else in it is only for deploying.

## Commands

Run `just` with no arguments to see every recipe, grouped. The most common ones:

```sh
just dev               # run all three apps together (web, api, marketing)
just check             # typecheck everything, including the Alchemy stack
just lint              # oxlint + ESLint (Svelte markup only)
just format            # auto-format with oxfmt
just generate          # generate a new migration from the Drizzle schema
just deploy pr-test    # deploy a throwaway stage by hand; `just destroy pr-test` removes it
```

## Theming

The theme is the combination of semantic variables in `packages/ui/src/global.css` and the visual implementations in `packages/ui/src/components`. Feature code uses semantic classes (`bg-background`, `text-muted-foreground`, `bg-primary`, …), while a Custom design may also change component shape, spacing, borders, shadows, typography, and interaction treatment without changing component APIs or behavior. Design review happens in the actual locally running product, using its real features and surfaces. See `.agents/skills/ui-and-theme` for the full contract.

## Deploying

[Alchemy](https://alchemy.run) provisions everything from `alchemy.run.ts`: the API Worker with its
D1 database and R2 bucket, and the web app and marketing site as static-asset Workers. There's no
`wrangler.jsonc`. Each environment is an Alchemy **stage**, deployed by GitHub Actions:

| Stage         | Deployed when                                                  | Workflow         |
| ------------- | -------------------------------------------------------------- | ---------------- |
| `pr-{number}` | a PR into `staging` is opened or updated                       | `preview.yml`    |
| `staging`     | a PR merges into `staging`                                     | `staging.yml`    |
| `prod`        | a PR merges into `main` (promote: merge `staging` into `main`) | `production.yml` |

A PR's stage is destroyed when the PR closes. Nothing in CI can destroy `staging` or `prod`, and
`prod`'s database and bucket are kept even by a hand-run `pnpm run destroy`. On `pr-*` and `staging` the web
app, API, and marketing site sit behind one Cloudflare Access application, and the API also verifies
the Access token itself; `prod` is public. Every deploy is also reported
to project-ops, Pinebase's deployment dashboard, when `PROJECT_OPS_URL` is set.

### One-time setup

1. Set `name` in the root `package.json` to your project's name, e.g. `my-app`. Every Cloudflare
   resource is named after it (`my-app-api-staging`, the `my-app-ci` token, ...), and so is the
   project in project-ops. Deploys refuse to run while it's still `svelteflare`, and the workflows
   never deploy from the template repository itself. Keep the name once deployed: changing it starts
   a new stack and leaves the old one running.
2. `pnpm bootstrap:github` (see `alchemy/github.ts` for the admin profile it needs) mints a
   Cloudflare API token scoped to exactly what the stack deploys and stores it in the repo's secrets,
   along with the project-ops token. It also pushes the variables below if they're in your `.env`.
3. Set the rest in the repo's **Settings → Secrets and variables → Actions**:

| Name                                                          | Kind        | Needed for                                                 |
| ------------------------------------------------------------- | ----------- | ---------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                                          | secret      | every stage (`openssl rand -base64 32`)                    |
| `CLOUDFLARE_WORKERS_SUBDOMAIN`                                | variable    | every stage on `workers.dev` (dashboard: Workers & Pages)  |
| `CF_ACCESS_ALLOW_EMAIL`                                       | secret      | `pr-*`, `staging`: who may log in (comma-separated)        |
| `CF_GOOGLE_IDP_ID`                                            | variable    | `pr-*`, `staging`: the Zero Trust Google identity provider |
| `CF_ACCESS_TEAM_DOMAIN`                                       | variable    | `pr-*`, `staging`: the Zero Trust team name                |
| `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`                   | secret      | optional features                                          |
| `STRIPE_API_KEY`                                              | secret      | registering each stage's Stripe webhook endpoint           |
| `PUBLIC_GOOGLE_CLIENT_ID`, `EMAIL_FROM_*`                     | variable    | optional features                                          |
| `PROD_API_DOMAIN`, `PROD_APP_DOMAIN`, `PROD_MARKETING_DOMAIN` | variable    | optional custom domains on `prod`                          |
| `PROJECT_OPS_URL`, `CF_ACCESS_CLIENT_ID`/`_SECRET`            | var/secrets | reporting to project-ops                                   |

Until `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist, every workflow exits green without
deploying.

Repository-level values serve `staging` and previews. For `prod`, create a GitHub Environment named
`production` and set the values that must differ there: the live-mode `STRIPE_SECRET_KEY`, a live
restricted `STRIPE_API_KEY` (webhook endpoints: write only), and its own `BETTER_AUTH_SECRET`.
Environment secrets override repository ones for the prod deploy only.

### Email

Verification codes and password resets go out through
[Cloudflare Email Service](https://developers.cloudflare.com/email-service/). Onboard a sending
domain once (dashboard: Email Service → Onboard Domain; with the domain's DNS on Cloudflare, the
DKIM/SPF records are created for you), then set `EMAIL_FROM_ADDRESS` to an address on it. Every
stage then sends real email, whatever hostname its Worker runs on; without it, emails are skipped
and logged. Use separate senders so preview testing can't hurt production's sending reputation: a
repository variable on a test subdomain (e.g. `noreply@test-mail.example.com`) for `staging` and
previews, and a `production` environment variable (`noreply@mail.example.com`) for prod. All stages
share the account's daily sending quota, which starts small and grows over time.

### Google sign-in

Google only redirects to callback URLs registered in advance, and each preview's URL is new. So on
`pr-*` and `staging`, better-auth's OAuth proxy routes Google's callback through staging's API, which
exchanges the code and hands the profile back to the preview, encrypted with the
`BETTER_AUTH_SECRET` the two share. The user and session are created in the preview's own database.
Register two redirect URIs on the Google OAuth client, once (`<APP>` is your `package.json` name):

- `https://<APP>-api-staging.<CLOUDFLARE_WORKERS_SUBDOMAIN>.workers.dev/v1/auth/callback/google`
- prod's API URL + `/v1/auth/callback/google` (prod doesn't use the proxy)

### Stripe

`staging` and every `pr-*` stage share one Stripe sandbox; `prod` uses live mode. Each stage's
webhook endpoint is registered by the stack (`alchemy/Stripe.ts`) and its signing secret passed
straight to the API: created and deleted with a PR's preview, created once for `staging`, and kept
even on destroy for `prod`. Because the sandbox is shared, each endpoint also receives the other
stages' events, which better-auth ignores. Stripe allows 16 endpoints per account, so about 15 open
PRs can have webhooks at once. On the gated stages, Access lets exactly the webhook path through;
Stripe's signature, which better-auth checks, protects it. Locally, run
`stripe listen --forward-to localhost:9003/v1/auth/stripe/webhook` and put the secret it prints in
`.env` as `STRIPE_WEBHOOK_SECRET`.

### By hand

With the same values in `.env`, `pnpm run deploy --stage pr-test` deploys a throwaway stage from your
machine and `pnpm run destroy --stage pr-test` removes it. Local state lives in `.alchemy/`; CI keeps its
state in Cloudflare.

### Known gaps

- **Custom domains** need zone permissions the CI token doesn't have (see
  `alchemy/ciTokenPolicies.ts`).
- **Cross-site cookies.** The web app and API are separate hosts. On `workers.dev` they're the same
  site (`workers.dev` is a public suffix, so both share `<account>.workers.dev`), and so are sibling
  subdomains of one domain (`app.` and `api.`). Unrelated domains would make the session cookie
  cross-site, so keep production on one domain.
- **Patched Alchemy.** Alchemy 2.0.0-beta.79 doesn't expose the Access application's CORS and cookie
  settings the gated API needs; `patches/alchemy@2.0.0-beta.79.patch` adds them. Upgrading Alchemy
  fails the install until the patch is redone or dropped (drop it once Alchemy ships the settings).

## Working with an AI coding agent

If you're extending this repo with Claude Code or a similar tool, read `AGENTS.md` first — it covers the non-negotiable theming rules — and the guides in `.agents/skills/` for feature work, forms, and auth/billing patterns.

## About

Svelteflare is an open-source project maintained by [Pinebase](https://github.com/pinebasedev). It exists so developers don't have to rebuild auth, billing, and UI infrastructure from scratch for every new SaaS idea — clone it, make it yours, and spend your time on the product instead.

Questions or ideas? Open an issue on [GitHub](https://github.com/pinebasedev/svelteflare/issues).

## License

[MIT](LICENSE)
