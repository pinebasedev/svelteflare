# Infrastructure (Alchemy)

`../alchemy.run.ts` assembles these files into one stack, deployed once per stage. See the root
README's "Deploying" section for stages, workflows, and the secrets and variables they read.

| File                 | What it declares                                                                |
| -------------------- | ------------------------------------------------------------------------------- |
| `project.ts`         | Every Cloudflare-side name (`APP`, from `package.json`), and Worker names/URLs  |
| `Api.ts`             | The `apps/api` Worker and all its bindings                                      |
| `Web.ts`             | The `apps/web` SPA and the `apps/marketing` site, as static-asset Workers       |
| `Db.ts`              | D1, migrations from `apps/api/migrations`; retained on `prod`                   |
| `Storage.ts`         | R2 (`STORAGE`); force-emptied on `pr-*` teardown, retained on `prod`            |
| `Access.ts`          | The Cloudflare Access gate on `pr-*` and `staging`                              |
| `Stripe.ts`          | The stage's Stripe webhook endpoint; its secret goes to the API; kept on `prod` |
| `config.ts`          | Config helpers with dev fallbacks                                               |
| `github.ts`          | The one-time credential bootstrap stack (`pnpm bootstrap:github`)               |
| `ciTokenPolicies.ts` | What the CI token may do                                                        |

Things that aren't obvious from the code:

- **`AppBindings` is written by hand.** `apps/api/src/types.d.ts` mirrors `Api.ts`'s `env`. Change
  both together.
- **URLs are fixed before anything deploys.** The web build bakes in the API's URL, and the API
  needs the web app's for CORS and better-auth. Both come from the explicit Worker names and
  `CLOUDFLARE_WORKERS_SUBDOMAIN` (which Alchemy also uses for the Workers' own URLs), so neither
  waits on the other.
- **One Access application per review stage covers all three Workers.** The web app calls the API
  cross-origin, which needs the application's eager redirect cookie, preflight bypass, and `SameSite`
  setting. Alchemy doesn't expose those yet, so `patches/alchemy@2.0.0-beta.79.patch` adds them.
  See `Access.ts`. The API also verifies the Access JWT itself (`CF_ACCESS_AUD`).
- **Not `Cloudflare.Website.SvelteKit`.** In Alchemy 2.0.0-beta.79 it requires SvelteKit 3 and
  refuses a project with `svelte.config.js`. The apps are static, so `StaticSite` builds them.
- **One name, from `package.json`.** `APP` is the root `package.json` `name`: every Worker, token,
  and stack name follows it. Deploys and the bootstrap refuse to run while it's still `svelteflare`,
  and the workflows skip deploys in the template repository itself.

Still unverified before the first real deploy (`pnpm run deploy --stage pr-test`):

- Alchemy's rolldown bundle of the API (better-auth, drizzle, stripe under `nodejs_compat`).
- The Access flow end to end: eager cookies on Worker destinations, and the SPA's API calls behind
  the gate. (The two `workers.dev` hosts are the same site, so the session cookie itself should work.)
- The `RateLimit` bindings on an async Worker. The middleware no-ops if they're missing.
