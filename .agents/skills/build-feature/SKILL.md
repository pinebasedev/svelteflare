---
name: build-feature
description: >
  Main orchestration skill for adding features to the svelteflare monorepo.
  Invoke whenever the user wants to add, build, implement, or create any new
  functionality — a page, API endpoint, DB table, form, component, auth-gated
  route, billing feature, or any combination. Trigger on "add X", "build X",
  "implement X", "I want X to do Y", "create a [page/endpoint/form/feature]",
  "wire up X", "make it so users can X". When in doubt, invoke — it's better
  to orchestrate than to start coding blind in a multi-layer monorepo.
---

# Build Feature

Orchestrate new feature work in this Svelte 5 + Hono monorepo on Cloudflare. The app has two deployed layers — `apps/api` (Hono worker, Cloudflare Workers) and `apps/web` (SvelteKit SPA, Cloudflare Pages) — plus shared `packages/ui`. Most features touch more than one layer; the value of this skill is coordinating them in the right order.

## Step 1: Classify the feature

| Type         | Layers affected                                         |
| ------------ | ------------------------------------------------------- |
| UI-only      | `apps/web` only — new page, component, or visual change |
| Backend-only | `apps/api` only — new endpoint, DB change, middleware   |
| Full-stack   | Both apps, possibly `packages/ui`                       |

Ask the user if it isn't obvious. Knowing the scope determines which layers to read before proposing any code.

## Step 2: Inspect before coding

Read the relevant existing files first. This prevents duplicate logic, wrong conventions, and mismatched types.

| What you're adding          | Read first                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------- |
| New API route               | `apps/api/src/routes/index.ts`, an existing route file (e.g. `routes/access.ts`)    |
| New DB table                | `apps/api/src/db/schema.ts`, `apps/api/migrations/`                                 |
| New web page                | `apps/web/src/routes/` directory listing, `apps/web/src/routes/+layout.ts`          |
| New form                    | `apps/web/src/lib/forms/` for existing schemas; a page that already uses superforms |
| New shared component        | `packages/ui/src/components/ui/`, `packages/ui/src/index.ts`                        |
| Auth or subscription gating | `apps/api/src/middleware/authorization.ts`, `apps/api/src/routes/index.ts`          |

If you haven't oriented to the repo yet, run `/project-orientation` first.

## Step 3: Show a plan, then implement

Before writing code, work out the exact files to create or modify, then present the plan **in plain language** — the user is a non-technical founder. Describe what they will be able to see and do, not file paths or commands. Keep the technical breakdown for yourself. Example:

```
Internal plan (not shown to the user):
1. apps/api/src/db/schema.ts — add `note` table
2. Run: pnpm --filter api generate:db  (new migration)
3. apps/api/src/routes/notes.ts — create CRUD route
4. apps/api/src/routes/index.ts — register /v1/notes
5. apps/web/src/lib/forms/note-schema.ts — Zod schema
6. apps/web/src/routes/notes/+page.svelte — list + create UI

What you tell the user:
"Here's what I'll build: a Notes page where you can create and view
notes. Notes are saved to your app's database and only visible to
signed-in users. Sound good?"
```

Only proceed past this step once the user agrees.

## Step 4: Backend implementation (apps/api)

### Adding a DB table

1. Add to `apps/api/src/db/schema.ts` using drizzle-orm's `sqliteTable`
2. Generate migration: `pnpm --filter api generate:db`
3. Apply locally: `pnpm --filter api migrate:local`

### Adding a route

1. Create `apps/api/src/routes/<name>.ts` — export a Hono router
2. Register in `apps/api/src/routes/index.ts` under `/v1/<name>`
3. Apply the right guard:
   - Public: no middleware
   - Auth required: `requireAuthenticated`
   - Subscription required: `requireEntitled`
4. Validate request bodies with Zod via the `validation` middleware

### Context variables (set by middleware, available in all handlers)

```ts
c.var.db; // Drizzle D1 client
c.var.auth; // Better-Auth instance
c.var.session; // Current session (after requireAuthenticated)
c.var.user; // Current user (after requireAuthenticated)
c.var.activeSubscription; // Active subscription or null
c.var.isEntitled; // Boolean — paid user or free-tier allowed
```

## Step 5: Frontend implementation (apps/web)

**Before writing any UI, follow the `ui-and-theme` skill.** All UI is built from `@repo/ui` components styled with semantic theme tokens (`bg-primary`, `text-muted-foreground`, …) — never Tailwind palette classes, hex/rgb/oklch literals, or arbitrary color values, and never raw `<button>`/`<input>`/`<select>` markup. Check `packages/ui/src/index.ts` before assuming a component is missing. `packages/ui/src/global.css` and `packages/ui/src/components` are theme-owned — do not touch them during feature work.

### Adding a page

Create `apps/web/src/routes/<path>/+page.svelte`. The root layout loader already fetches `/v1/access` on every navigation, so layout data is always available:

```ts
let { data } = $props();
// data.user, data.session, data.isEntitled, data.activeSubscription
```

For page-specific data, add a sibling `+page.ts` with a `load` function that calls `apiFetch`.

### Adding a form

1. Write a Zod schema in `apps/web/src/lib/forms/<name>-schema.ts`
2. Use sveltekit-superforms with the Zod adapter on the page
3. Use form components from `@repo/ui`: `<Form.Field>`, `<Form.Label>`, `<Form.FieldErrors>`, `<Input>`, `<Button>` etc. (see the `forms` skill)

### Calling the API

```ts
import { apiFetch } from '$lib/api';
const result = await apiFetch('/v1/<route>', { method: 'POST', body: payload });
```

### Components

- Page-local (used in one place only) → `apps/web/src/lib/components/`
- Shared across pages → `packages/ui/src/components/ui/<name>/`; export from `packages/ui/src/index.ts`

### State management

Follow the singleton runes class pattern in `apps/web/src/lib/state/settings.svelte.ts`: export a class with `$state` fields and a single exported instance.

## Key conventions

- **No SSR**: The web app is a pure SPA (`ssr = false` in `+layout.ts`). Don't add SvelteKit server-side loaders; fetch data client-side via `apiFetch`.
- **Validation**: Zod everywhere. Never duplicate schemas between api and web — if a shape is truly shared, consider moving it to a `packages/` package.
- **Import alias**: `$lib/*` in web maps to `apps/web/src/lib/`. Use it consistently.
- **Route registration**: All Hono routes must be registered in `apps/api/src/routes/index.ts` — routes defined but not registered there are unreachable.
- **Migrations**: Never hand-edit migration SQL files. Always run `generate:db` after schema changes.

## Step 6: Summarize changes

After implementing, run any needed follow-up commands yourself (e.g. `pnpm --filter api migrate:local`), then summarize for the user in plain language — what changed from their point of view, not which files moved:

```
"Done! Your app now has a Notes page. You can create notes, see your
list, and each note is saved privately to your account. Take a look
at the preview and tell me if you'd like anything adjusted."
```

Keep file paths, shell commands, and migration names out of the user-facing summary. If something needs the user's action (e.g. approving a change in the browser), state it as one simple step.
