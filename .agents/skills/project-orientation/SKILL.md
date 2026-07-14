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

| Layer | Package | Port | Tech |
|-------|---------|------|------|
| API | `@repo/api` | 9003 | Hono + Drizzle ORM + better-auth, runs as a Cloudflare Worker |
| Web | `@repo/web` | 9002 | SvelteKit static SPA served by a Cloudflare Worker (static assets) |

The API handles all business logic; the web app is a pure frontend that talks to the API via `PUBLIC_API_URL`.

## Monorepo Layout

```
/
├── apps/
│   ├── api/          # Cloudflare Worker — auth, DB, Stripe, business logic
│   └── web/          # SvelteKit SPA — all UI and routing
├── packages/
│   ├── ui/           # Shared shadcn-svelte component library
│   ├── typescript-config/  # Shared tsconfig bases (svelte.json, worker.json)
│   └── eslint-config/      # Shared ESLint config
├── Justfile          # Convenience recipes (dev, build, deploy, db, lint)
├── turbo.json        # Turborepo task pipeline
└── pnpm-workspace.yaml
```

Package names use the `@repo/*` workspace alias.

## Where Things Live

### UI Components
- Shared library: `packages/ui/src/components/ui/` (shadcn-svelte / bits-ui)
  - ~57 components exported — read `packages/ui/src/index.ts` for the current list before building or installing anything
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
- Cloudflare Workers: `apps/api/wrangler.jsonc` (D1 bindings, env vars, rate limits)
- Web worker (static assets): `apps/web/wrangler.jsonc`
- TypeScript: each app extends `@repo/typescript-config/{svelte,worker}.json`
- Tailwind: v4 via `@tailwindcss/vite` plugin — no separate config file
- Prettier: root `.prettierrc` (single quotes, print width 100, no trailing commas)
- ESLint: `packages/eslint-config/index.js` — all apps inherit

### Validators & Types
- Zod form schemas: `apps/web/src/lib/forms/*-schema.ts`
  - Pattern: `export const [name]FormSchema = z.object({...})`
- API context types: `apps/api/src/types.d.ts` (`AppBindings`, `AppVariables`, `AppEnv`)
- Auth types: `AuthUser`, `AuthSession`, `ActiveSubscription` from `apps/api/src/helpers/access.ts`
- SvelteKit types: `apps/web/src/app.d.ts`
- Web state: `apps/web/src/lib/state/` (Svelte 5 state classes, e.g. `settings.svelte.ts`)

## Available Commands

**Root (runs all apps via Turbo):**
```bash
pnpm dev        # Start all dev servers
pnpm build      # Build everything
pnpm lint       # Lint all packages
pnpm check      # Type-check all packages
pnpm format     # Prettier format everything
```

**Just recipes (preferred for targeted work):**
```bash
just dev-web / just dev-api / just dev   # Dev servers
just build-web / just build-api          # Builds
just deploy-web-staging / just deploy-web-production
just deploy-api-staging / just deploy-api-production
just db-push / just db-pull / just db-seed
just lint / just format / just check / just clean
```

**API-specific:**
```bash
pnpm --filter @repo/api cf-typegen       # Regenerate wrangler types
pnpm --filter @repo/api generate:db      # Generate Drizzle migration
pnpm --filter @repo/api migrate:local    # Apply migrations locally
pnpm --filter @repo/api test             # Run Vitest
```

**Web-specific:**
```bash
pnpm --filter @repo/web build:staging    # Build for staging env
pnpm --filter @repo/web deploy:staging   # Deploy the web worker to staging
```

## Deployment (GitHub Actions — managed by Pinebase)

CI/CD lives in `.github/workflows/deploy.yml`:

- Push to `staging` → quality gates (typecheck, format, lint) + build + deploy of the **preview** app. Push to `main` → same for the **live** app (`main` is only reached via Pinebase's promote flow — never push to it directly).
- The pipeline decides on its own whether to deploy the api, the web app, or both, by comparing against the `pinebase-deploy-staging` / `pinebase-deploy-production` git tags (last deployed commit per environment). D1 migrations are applied automatically before an api deploy.
- **Never edit or delete `.github/workflows/deploy.yml` or the `pinebase-deploy-*` tags.** `apps/web/.env.staging` and `apps/web/.env.production` are managed by Pinebase too (public URLs baked into the web build) — leave their Pinebase-written lines intact.

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

| Area | Read first |
|------|-----------|
| Auth flows | `apps/api/src/auth.ts`, `middleware/auth.ts`, `helpers/access.ts`, `routes/auth.ts` |
| DB schema | `apps/api/src/db/schema.ts`, `drizzle.config.ts`, `migrations/` |
| Shared UI | `packages/ui/src/index.ts`, `packages/ui/src/components/ui/` |
| App-specific UI | `apps/web/src/lib/components/`, `apps/web/svelte.config.js` |
| API routes | `apps/api/src/routes/index.ts`, `src/types.d.ts`, `src/middleware/` |
| Web pages | `apps/web/src/routes/`, `src/lib/forms/`, `svelte.config.js` |
| Adding deps | Check root + app `package.json`; respect `.syncpackrc.json` for version sync |
| Build/deploy | `turbo.json` for task deps; `Justfile` for quick recipes |
