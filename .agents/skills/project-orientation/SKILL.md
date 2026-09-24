---
name: project-orientation
description: >
  Orient Claude to the svelteflare monorepo before starting any task. Use this skill
  whenever the user says "orient yourself", "explain the repo", "what's the structure here",
  or kicks off a task where knowing where things live matters. Also invoke it proactively
  at the start of a new session in this repo — it saves repeated filesystem spelunking
  and gives you the full picture in one read.
---

# Svelteflare — Project Orientation

This orientation is for you, the agent — don't recite it to the user. The user is a non-technical founder: when they ask about the project, translate to plain language (what the app does and where things stand, not ports, packages, or file paths). The non-negotiable UI/theme rules live in the root `AGENTS.md` — read them before any UI work.

## Architecture

Two-layer Cloudflare stack:

| Layer     | Package           | Port | Tech                                                               |
| --------- | ----------------- | ---- | ------------------------------------------------------------------ |
| API       | `@repo/api`       | 9003 | Hono + Drizzle ORM + better-auth, runs as a Cloudflare Worker      |
| Web       | `@repo/web`       | 9002 | SvelteKit static SPA served by a Cloudflare Worker (static assets) |
| Marketing | `@repo/marketing` | 9001 | Prerendered SvelteKit site served by a Cloudflare Worker           |

The API handles all business logic; the web app is a pure frontend that talks to the API via `PUBLIC_API_URL`.

## Monorepo Layout

```
/
├── apps/
│   ├── api/          # Cloudflare Worker — auth, DB, Stripe, business logic
│   ├── web/          # SvelteKit SPA — all UI and routing
│   └── marketing/    # Static marketing site
├── alchemy/          # Infrastructure: one file per Cloudflare resource
├── alchemy.run.ts    # The Alchemy stack (dev, deploy, destroy)
├── packages/
│   ├── ui/           # Shared shadcn-svelte component library
│   ├── typescript-config/  # Shared tsconfig bases (svelte.json, worker.json)
│   └── lint/               # Theme lint rule, oxlint plugin, Svelte ESLint config
├── Justfile          # Convenience recipes (dev, build, deploy, db, lint)
├── turbo.json        # Turborepo task pipeline
└── pnpm-workspace.yaml
```

Package names use the `@repo/*` workspace alias.

## Where Things Live

### UI Components

- Shared library: `packages/ui/src/components/ui/` (shadcn-svelte / bits-ui)
  - 56 components exported — read `packages/ui/src/index.ts` for the current list before building or installing anything
- App-specific components: `apps/web/src/lib/components/`
- Add new shadcn components: `pnpm --filter @repo/ui ui:add <component-name>`
- Import alias: `@repo/ui` → `packages/ui/src` (configured in `apps/web/svelte.config.js`)
- Styling: theme tokens only (`bg-primary`, `text-muted-foreground`, …) — no palette classes or color literals; see root `AGENTS.md` and the `ui-and-theme` skill

### Auth

- Server config: `apps/api/src/auth.ts` — better-auth v1 with Stripe plugin + emailOTP
- Middleware: `apps/api/src/middleware/auth.ts` — resolves session, sets ctx vars
- Helpers/access control: `apps/api/src/helpers/access.ts`
- API routes: `apps/api/src/routes/auth.ts`
- Client (web): `apps/web/src/lib/authClient.ts`
- Form schemas: `apps/web/src/lib/forms/` (`login`, `register`, `password-reset`, `request-password-reset`)

### Database

- Schema: `apps/api/src/db/schema.ts` — Drizzle ORM, SQLite (Cloudflare D1)
  - Tables: `user`, `session`, `account`, `verification`, `subscription`, `plan`
- DB instance: `apps/api/src/db/database.ts` (singleton, uses `env.DB` binding)
- Drizzle config: `apps/api/drizzle.config.ts`
- Migrations: `apps/api/migrations/`

### Config Files

- Cloudflare resources: `alchemy.run.ts` + `alchemy/` (Alchemy). `alchemy/Api.ts` declares the API's
  bindings, env vars, and rate limits; `alchemy/Web.ts` the web and marketing sites. Config and
  secrets come from the root `.env` (see `.env.example`) or GitHub Actions secrets/variables.
- TypeScript: each app extends `@repo/typescript-config/{svelte,worker}.json`
- Tailwind: v4 via `@tailwindcss/vite` plugin — no separate config file
- Formatting: oxfmt, root `.oxfmtrc.json` (single quotes, print width 100, no trailing commas; tabs +
  Tailwind class sorting in `.svelte`). `apps/api/.oxfmtrc.json` keeps the API's double quotes.
  Generated shadcn components (`packages/ui/src/components`) are not formatted.
- Linting: oxlint, root `.oxlintrc.json`, for all JS/TS (including `<script>` in `.svelte`). ESLint
  runs only on `.svelte` files (`packages/lint/eslint.js`), for the markup rules oxlint can't see.

### Validators & Types

- Zod form schemas: `apps/web/src/lib/forms/*-schema.ts`
  - Pattern: `export const [name]FormSchema = z.object({...})`
- API context types: `apps/api/src/types.d.ts` (`AppBindings`, `AppVariables`, `AppEnv`)
- Auth types: `AuthUser`, `AuthSession`, `ActiveSubscription` from `apps/api/src/helpers/access.ts`
- SvelteKit types: `apps/web/src/app.d.ts`
- Web state: `apps/web/src/lib/state/` (Svelte 5 state classes, e.g. `settings.svelte.ts`)

## Available Commands

**Root:**

```bash
pnpm dev        # alchemy dev: API in workerd with local D1/R2/email, web + marketing via Vite
pnpm build      # Build the web and marketing sites
pnpm lint       # oxlint, then ESLint on .svelte files
pnpm check      # Type-check all packages and the Alchemy stack
pnpm format     # oxfmt format everything
pnpm run deploy --stage <name> / pnpm run destroy --stage <name>   # Hand deploys (CI does the real ones)
```

`just` has the same recipes (`just dev`, `just check`, `just deploy pr-test`, …).

**API-specific:**

```bash
pnpm --filter @repo/api generate:db      # Generate a Drizzle migration
pnpm --filter @repo/api generate:auth    # Regenerate the Better Auth schema
```

Migrations are applied by Alchemy: locally on the next `pnpm dev`, remotely on the next deploy.
Emails sent under `pnpm dev` (e.g. sign-up codes) land in `.alchemy/local/email/*.eml`.

## Deployment (Alchemy + GitHub Actions)

- `.github/workflows/preview.yml`: every PR into `staging` gets its own `pr-{number}` stage (typecheck,
  lint, and format run first), updated on each push and destroyed when the PR closes.
- `staging.yml` / `production.yml`: a merged PR into `staging` deploys `staging`; into `main`, `prod`.
- Every deploy is reported to project-ops (`scripts/project-ops.sh`).
- `pr-*` and `staging` sit behind Cloudflare Access; `prod` is public.

## Conventions

**Import aliases:**

- `$lib/*` — SvelteKit standard (`apps/web/src/lib/`)
- `@repo/ui` — Shared component library
- `$env/static/public` — SvelteKit public env vars (prefixed `PUBLIC_*`)

**Naming:**

- Components: `PascalCase.svelte` (e.g. `LoginForm.svelte`)
- Form schemas: `camelCaseFormSchema` (e.g. `loginFormSchema`)
- API routes: lowercase kebab at `/v1/*` (e.g. `/v1/subscriptions/access`)
- DB tables: lowercase singular (e.g. `user`, `session`, `subscription`)
- Env vars: `SCREAMING_SNAKE_CASE`; public ones prefixed `PUBLIC_`
- State classes: `settings.svelte.ts` (Svelte 5 reactive class pattern)

**File organization:**

- API routes → `apps/api/src/routes/<feature>.ts`, registered in `routes/index.ts`
- API middleware → `apps/api/src/middleware/`
- API helpers → `apps/api/src/helpers/`
- Web pages → `apps/web/src/routes/` (SvelteKit file-based routing)

## What to Inspect Before Editing

| Area            | Read first                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| Auth flows      | `apps/api/src/auth.ts`, `middleware/auth.ts`, `helpers/access.ts`, `routes/auth.ts` |
| DB schema       | `apps/api/src/db/schema.ts`, `drizzle.config.ts`, `migrations/`                     |
| Shared UI       | `packages/ui/src/index.ts`, `packages/ui/src/components/ui/`                        |
| App-specific UI | `apps/web/src/lib/components/`, `apps/web/svelte.config.js`                         |
| API routes      | `apps/api/src/routes/index.ts`, `src/types.d.ts`, `src/middleware/`                 |
| Web pages       | `apps/web/src/routes/`, `src/lib/forms/`, `svelte.config.js`                        |
| Adding deps     | Check root + app `package.json`; respect `.syncpackrc.json` for version sync        |
| Build/deploy    | `turbo.json` for task deps; `Justfile` for quick recipes                            |
