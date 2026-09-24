---
name: auth-db-billing
description: >
  Backend product systems skill for the svelteflare monorepo. Invoke whenever
  the user wants to work with auth, sessions, protected routes, users, the
  database, schema changes, migrations, Stripe billing, subscriptions,
  paid feature gates, or any server-only logic in the Hono API. Trigger on
  "add a protected route", "gate this behind a subscription", "add a DB column",
  "run migrations", "how do I check if the user is logged in", "add a new table",
  "wire up Stripe checkout", "check the user's plan", "add a role check",
  "add server-only logic", or any mention of better-auth, drizzle, D1, or Stripe.
  When in doubt, invoke — this skill prevents auth bypasses, wrong DB access
  patterns, and billing logic landing in the wrong layer.
---

# Auth / DB / Billing

Backend product systems for the svelteflare monorepo. All server logic lives in `apps/api` (Hono Worker). The SvelteKit app (`apps/web`) is a pure SPA with `ssr = false` — it has no `+page.server.ts` or `hooks.server.ts`. Every authenticated action, DB query, and billing operation goes through the Hono API.

---

## Architecture quick-map

```
apps/api/src/
  auth.ts               ← Better Auth singleton factory (getAuth)
  db/
    schema.ts           ← Drizzle schema: app tables + re-exports auth-schema.ts
    auth-schema.ts      ← Better Auth tables, GENERATED (pnpm --filter @repo/api generate:auth)
    database.ts         ← DB singleton factory (getDb)
  middleware/
    auth.ts             ← authMiddleware — resolves session on every request
    authorization.ts    ← requireAuthenticated, requireEntitled
    subscription.ts     ← subscriptionMiddleware — resolves isEntitled
    rateLimit.ts        ← rate limits differ by subscription tier
  routes/
    index.ts            ← route groups (public / authenticated / admin)
    auth.ts             ← passes all /v1/auth/* to Better Auth handler

apps/web/src/lib/
  authClient.ts         ← Better Auth client (browser-side)
  api.ts                ← Hono RPC client (hc<AppType>)
```

---

## Better Auth

### How auth is initialized

`getAuth(db, env)` in `apps/api/src/auth.ts` is a singleton factory. It takes the Drizzle DB instance and Cloudflare env bindings. Never call `betterAuth()` directly in a route — always use `getAuth`.

Active plugins:

- `emailOTP` — 6-digit OTP for email verification, 15-min expiry
- `@better-auth/stripe` — creates Stripe customer on signup, manages subscriptions
- Email/password (requires email verification before login)
- Google OAuth (`disableImplicitSignUp: true` — must sign up first)

**No org/role/team plugins are active.** The current auth model is single-user with subscription tiers only.

### Session access in Hono routes

`authMiddleware` runs on every request and sets these on the Hono context:

```ts
c.get('user'); // User object | null
c.get('session'); // Session object | null
c.get('db'); // Drizzle DB instance (set here for convenience)
```

`subscriptionMiddleware` runs after `authMiddleware` on authenticated route groups and adds:

```ts
c.get('isEntitled'); // boolean — active or trialing subscription
c.get('activeSubscription'); // subscription object | null
```

### Protecting routes

Routes are organized in groups in `apps/api/src/routes/index.ts`. Apply middleware at the group level, not per-route:

```ts
// Public — no auth required
app.route('/v1/public', publicRoutes);

// Authenticated — session required
const authRoutes = new Hono()
  .use(requireAuthenticated) // 401 if no session
  .use(subscriptionMiddleware);
authRoutes.route('/', myAuthenticatedRoutes);

// Entitled — active subscription required
const premiumRoutes = new Hono()
  .use(requireAuthenticated)
  .use(subscriptionMiddleware)
  .use(requireEntitled); // 403 if not entitled
premiumRoutes.route('/', myPremiumRoutes);
```

`requireAuthenticated` checks `c.get("session")` — returns 401 if missing.
`requireEntitled` checks `c.get("isEntitled")` — returns 403 if false.

### Web-side auth state

The SvelteKit layout calls `/v1/access` on every page load and stores the result in `page.data`:

```ts
// +layout.ts
const res = await apiFetch('/v1/access');
return { user, session, isEntitled, activeSubscription };
```

In Svelte components, guard UI with:

```svelte
<script>
  let { data } = $props()
</script>

{#if data.user}
  <!-- logged in -->
{/if}

{#if data.isEntitled}
  <!-- premium feature -->
{:else}
  <UpgradeCTA />
{/if}
```

Never replicate server-side auth checks in the SvelteKit layer — the Hono API is the source of truth.

### Auth client (browser)

`apps/web/src/lib/authClient.ts` exports the Better Auth client. Use it for all auth actions in the browser:

```ts
import { authClient } from '$lib/authClient';

// Sign in
await authClient.signIn.email({ email, password });

// Sign out
await authClient.signOut();

// Send OTP
await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });

// Verify OTP
await authClient.emailOtp.verifyEmail({ email, otp });
```

---

## Drizzle ORM + Cloudflare D1

### Schema location

Import every table from `apps/api/src/db/schema.ts`. The app's own tables (`plan`, and any you add) are defined there. The Better Auth tables are generated into `apps/api/src/db/auth-schema.ts` by Better Auth's CLI from `apps/api/auth.config.ts`, and `schema.ts` re-exports them. Never edit `auth-schema.ts` by hand: after changing a Better Auth plugin or option, mirror the change in `auth.config.ts`, run `pnpm --filter @repo/api generate:auth`, then generate the migration as below. Existing tables:

| Table          | Purpose                               |
| -------------- | ------------------------------------- |
| `user`         | Users — includes `stripeCustomerId`   |
| `session`      | Better Auth sessions                  |
| `account`      | OAuth provider accounts               |
| `verification` | Email/OTP verification tokens         |
| `subscription` | Active Stripe subscriptions           |
| `plan`         | Product plans (name, priceId, limits) |

### Conventions

- All IDs: `text()` with `$defaultFn(() => createId())` (CUID2)
- All timestamps: `integer()` in SQLite mode (Unix ms), not `timestamp()`
- Use `drizzle-orm/d1` imports for the D1 dialect

### Adding a new table

1. Add the schema definition to `apps/api/src/db/schema.ts`:

```ts
export const widget = sqliteTable('widget', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
});

export type Widget = typeof widget.$inferSelect;
export type NewWidget = typeof widget.$inferInsert;
```

2. Generate the migration:

```bash
just generate
```

3. Apply it: `pnpm dev` applies pending migrations to the local D1 on start (restart it if it's
   running), and every deploy applies them to that stage's database.

### Adding a column to an existing table

Same flow — edit the schema, `just generate`, restart `pnpm dev`. Never edit migration SQL files by hand.

### DB access in routes

`authMiddleware` sets `c.get("db")` — use that in every route handler:

```ts
import { widget } from '../db/schema';
import { eq } from 'drizzle-orm';

app.get('/widgets', async (c) => {
  const user = c.get('user')!;
  const db = c.get('db');

  const widgets = await db.select().from(widget).where(eq(widget.userId, user.id));

  return c.json({ widgets });
});
```

Never call `getDb(c.env)` inside route handlers — it's already set by middleware.

### Useful Drizzle operations

```ts
// Insert
await db.insert(widget).values({ userId: user.id, name: 'My Widget', createdAt: new Date() })

// Update
await db.update(widget).set({ name: 'Updated' }).where(eq(widget.id, id))

// Delete
await db.delete(widget).where(eq(widget.id, id))

// Transaction
await db.transaction(async (tx) => {
  await tx.insert(widget).values(...)
  await tx.update(user).set(...)
})
```

### Drizzle Studio

```bash
just studio
```

Opens a local browser UI for inspecting/editing the D1 database.

---

## Stripe Billing

Stripe is integrated entirely through the `@better-auth/stripe` plugin. There is no standalone Stripe route or webhook handler — all of it is handled by the Better Auth handler at `/v1/auth/*`.

### How subscriptions work

1. User signs up → plugin creates a Stripe customer automatically
2. User triggers upgrade → `authClient.subscription.upgrade()` creates a Checkout Session
3. User completes checkout → Stripe webhook fires → plugin updates `subscription` table
4. `subscriptionMiddleware` checks the subscription table → sets `isEntitled`

Plans are stored in the `plan` DB table and loaded at runtime by the plugin.

### Initiating checkout (web side)

```ts
import { authClient } from '$lib/authClient';

await authClient.subscription.upgrade({
  plan: 'premium', // matches plan.name in DB
  annual: isYearly, // uses annualDiscountPriceId if true
  successUrl: `${APP_URL}/?checkout=success`,
  cancelUrl: `${APP_URL}/premium`,
  returnUrl: `${APP_URL}/premium`
});
```

After checkout succeeds, refresh auth state so `isEntitled` updates:

```ts
import { invalidate } from '$app/navigation';
await invalidate('auth:session');
```

### Customer Portal (web side)

```ts
await authClient.subscription.cancel();
// or navigate to the portal URL returned by the plugin
```

The plugin manages the portal URL — no custom route needed.

### Adding a new plan

1. Create the product and price in the Stripe dashboard
2. Insert a row into the `plan` table with `name`, `priceId`, `annualDiscountPriceId`, `freeTrialDays`, `limits`
3. No code changes needed — the plugin reads plans from the DB at runtime

### Gating a feature by subscription

In Hono, apply `requireEntitled` middleware to the route group (see Protected Routes above). The middleware returns 403 automatically if `isEntitled` is false.

In the web app, check `data.isEntitled` from `page.data`. Show upgrade UI when false — never hide the route, just gate the content.

### Checking the user's plan in a route

```ts
const subscription = c.get('activeSubscription');
// subscription.plan — the plan name
// subscription.status — 'active' | 'trialing' | 'canceled' | ...
```

---

## Server-Only Logic

### Environment variables and secrets

Cloudflare bindings and secrets arrive through `c.env` (type `AppBindings`). Never import `process.env` — it doesn't exist in Workers.

```ts
// In a route handler
const secret = c.env.MY_SECRET;

// In getAuth / getDb factories (they receive env directly)
getAuth(db, c.env);
getDb(c.env);
```

Adding a binding, secret, or var takes three edits:

1. Declare it on the Worker's `env` in `alchemy/Api.ts` (a secret: `Config.Redacted('MY_SECRET')`).
2. Add it to `AppBindings` in `apps/api/src/types.d.ts` by hand.
3. Give it a value: the root `.env` locally (`.env.example` lists the names), and a GitHub Actions
   secret or variable passed to the deploy step in `.github/workflows/` for CI.

### Email (Cloudflare Email Workers)

The `EMAIL` binding is a `SendEmail` service, and it's optional: only local dev (a simulator that writes `.alchemy/local/email/*.eml`) and a prod stage on its own domain have it. `helpers/email.ts` logs and skips when it's absent. Access it via `c.env.EMAIL`. Sender address and name come from `c.env.EMAIL_FROM_ADDRESS` and `c.env.EMAIL_FROM_NAME`. Better Auth's emailOTP plugin uses this binding automatically for OTP emails.

### Hono RPC type safety

The web app imports `AppType` directly from the API source to get end-to-end typed API calls:

```ts
// apps/web/src/lib/api.ts
import { hc } from 'hono/client';
import type { AppType } from 'api/src/index';

const client = hc<AppType>(API_BASE_URL);
```

When you add a new Hono route, export its type through `AppType` so the web client stays typed automatically.
