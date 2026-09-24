import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as GitHub from 'alchemy/GitHub';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Redacted from 'effect/Redacted';
import { ciTokenPolicies } from './ciTokenPolicies.ts';
import { BOOTSTRAP_STACK, CI_TOKEN_NAME } from './project.ts';

/**
 * One-time credential bootstrap (project-ops ADR-0010). Mints this repo's
 * Cloudflare CI token and its project-ops bearer token, and pushes both, plus
 * the deploy config CI needs, into the GitHub repo. Run by hand from a laptop,
 * never from CI; re-running it rotates both tokens.
 *
 *   ALCHEMY_PROFILE=admin pnpm bootstrap:github
 *
 * `scripts/bootstrap-github.mjs` deploys this stack, then rolls the CI token
 * and verifies it (see there for why).
 *
 * One-time setup on the machine running it:
 *   - Alchemy's GitHub provider: `pnpm alchemy profile edit --profile admin
 *     --add GitHub`, "gh CLI" method (reuses `gh auth token`).
 *   - A Cloudflare profile with a *stored* token, not OAuth: Cloudflare's
 *     token-creation endpoint refuses OAuth sessions. Create a Custom Token in
 *     the dashboard with only "API Tokens: Edit", then `pnpm alchemy profile
 *     edit --profile admin --add Cloudflare` → "Stored" → paste it.
 *   - `wrangler login` against the same account (a separate credential cache),
 *     for the project-ops D1 write below.
 *
 * Reads from the environment or the root `.env`:
 *   - `CLOUDFLARE_ACCOUNT_ID`, `GITHUB_REPO` ("owner/repo"): required.
 *   - `PROJECT_NAME`: the project's name in project-ops. Defaults to the repo name.
 *   - `CONTROL_PLANE_DB`: project-ops' D1 database. Defaults to the name
 *     project-ops' `alchemy/Db.ts` pins.
 *   - `CLOUDFLARE_WORKERS_SUBDOMAIN`, `CF_GOOGLE_IDP_ID`, `CF_ACCESS_TEAM_DOMAIN`,
 *     `CF_ACCESS_ALLOW_EMAIL`:
 *     pushed for `alchemy.run.ts` to read in CI. Each is skipped with a warning
 *     when unset; deploys that need it fail until it's set.
 */
export default Alchemy.Stack(
  BOOTSTRAP_STACK,
  {
    providers: Layer.mergeAll(Cloudflare.providers(), GitHub.providers()),
    // Never run from CI, and must not depend on the remote state store that
    // the CI token it mints is needed to reach.
    state: Alchemy.localState()
  },
  Effect.gen(function* () {
    const accountId = yield* Config.String('CLOUDFLARE_ACCOUNT_ID');
    const [owner, repository] = (yield* Config.String('GITHUB_REPO')).split('/');
    const projectName = yield* Config.String('PROJECT_NAME').pipe(Config.withDefault(repository));
    const controlPlaneDb = yield* Config.String('CONTROL_PLANE_DB').pipe(
      Config.withDefault('production-project-ops-db')
    );
    const optional = (name: string) => Config.String(name).pipe(Config.withDefault(''));
    const workersSubdomain = yield* optional('CLOUDFLARE_WORKERS_SUBDOMAIN');
    const googleIdpId = yield* optional('CF_GOOGLE_IDP_ID');
    const accessTeamDomain = yield* optional('CF_ACCESS_TEAM_DOMAIN');
    const accessAllowEmail = yield* optional('CF_ACCESS_ALLOW_EMAIL');

    // Before anything is planned: the D1 write below runs as soon as this
    // generator does, not behind the plan's confirmation prompt.
    yield* Effect.try({
      try: () => assertGithubRepoExists(owner, repository),
      catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause)))
    }).pipe(Effect.orDie);

    const ciToken = yield* Cloudflare.ApiToken.AccountApiToken('ci-token', {
      name: CI_TOKEN_NAME,
      accountId,
      policies: ciTokenPolicies(accountId)
    });

    yield* GitHub.Secret('cf-api-token', {
      owner,
      repository,
      name: 'CLOUDFLARE_API_TOKEN',
      value: ciToken.value
    });
    yield* GitHub.Secret('cf-account-id', {
      owner,
      repository,
      name: 'CLOUDFLARE_ACCOUNT_ID',
      value: Redacted.make(accountId)
    });

    const { token: bearerToken, tokenHash } = yield* Effect.promise(() => mintBearerToken());
    yield* Effect.try({
      try: () =>
        writeProjectTokenHash({
          id: crypto.randomUUID(),
          name: projectName,
          tokenHash,
          githubRepo: `${owner}/${repository}`,
          dbName: controlPlaneDb
        }),
      catch: (cause) =>
        new Error(
          `Failed to write the bearer-token hash into '${controlPlaneDb}' with \`wrangler d1 execute\`. ` +
            "Check that `wrangler login` ran against project-ops' Cloudflare account and that " +
            `'${controlPlaneDb}' is its database (\`wrangler d1 list\`).`,
          { cause }
        )
    }).pipe(Effect.orDie);
    yield* GitHub.Secret('idp-project-token', {
      owner,
      repository,
      name: 'IDP_PROJECT_TOKEN',
      value: Redacted.make(bearerToken)
    });

    if (workersSubdomain) {
      yield* GitHub.Variable('cf-workers-subdomain', {
        owner,
        repository,
        name: 'CLOUDFLARE_WORKERS_SUBDOMAIN',
        value: workersSubdomain
      });
    } else {
      yield* Effect.logWarning(
        'CLOUDFLARE_WORKERS_SUBDOMAIN is not set: every workers.dev deploy fails until the ' +
          'repo variable exists (dashboard: Workers & Pages → Settings → Subdomain).'
      );
    }
    if (googleIdpId) {
      yield* GitHub.Variable('cf-google-idp-id', {
        owner,
        repository,
        name: 'CF_GOOGLE_IDP_ID',
        value: googleIdpId
      });
    } else {
      yield* Effect.logWarning(
        'CF_GOOGLE_IDP_ID is not set: pr-*/staging deploys fail until the repo variable ' +
          "exists (copy it from project-ops' .env; same Zero Trust org)."
      );
    }
    if (accessTeamDomain) {
      yield* GitHub.Variable('cf-access-team-domain', {
        owner,
        repository,
        name: 'CF_ACCESS_TEAM_DOMAIN',
        value: accessTeamDomain
      });
    } else {
      yield* Effect.logWarning(
        'CF_ACCESS_TEAM_DOMAIN is not set: pr-*/staging deploys fail until the repo variable ' +
          "exists (copy it from project-ops' .env; same Zero Trust org)."
      );
    }
    // A secret, not a variable: variables print unmasked in Actions logs.
    if (accessAllowEmail) {
      yield* GitHub.Secret('cf-access-allow-email', {
        owner,
        repository,
        name: 'CF_ACCESS_ALLOW_EMAIL',
        value: Redacted.make(accessAllowEmail)
      });
    } else {
      yield* Effect.logWarning(
        'CF_ACCESS_ALLOW_EMAIL is not set: pr-*/staging deploys fail until the repo secret exists.'
      );
    }

    return { tokenId: ciToken.tokenId, tokenName: ciToken.name, projectName };
  })
);

/**
 * Shells out to `gh` rather than Alchemy's GitHub client, which a Stack body
 * can't reach. With the "gh CLI" provider method both use the same credential.
 */
function assertGithubRepoExists(owner: string | undefined, repository: string | undefined): void {
  if (!owner || !repository) {
    throw new Error(`GITHUB_REPO must be "owner/repo" (got "${owner ?? ''}/${repository ?? ''}").`);
  }
  try {
    execFileSync('gh', ['repo', 'view', `${owner}/${repository}`], { stdio: 'ignore' });
  } catch (cause) {
    throw new Error(
      `GitHub repo '${owner}/${repository}' doesn't exist or isn't reachable with the current ` +
        `'gh' auth. Create it first, e.g. 'gh repo create ${owner}/${repository} --private ` +
        "--source=. --push', then re-run.",
      { cause }
    );
  }
}

// ── project-ops bearer token ────────────────────────────────────────────
// A copy of project-ops' apps/api/src/helpers/tokens.ts (a separate repo, so
// not an import). Keep the two in sync by hand.

const TOKEN_BYTES = 32;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function mintBearerToken(): Promise<{ token: string; tokenHash: string }> {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return { token, tokenHash: toHex(digest) };
}

const escapeSqlString = (value: string) => value.replace(/'/g, "''");

/**
 * Upserts the project's row in project-ops' D1 directly: project-ops has no
 * route that mints or overwrites a project's token, for any caller (ADR-0010).
 * First run inserts; later runs only replace `token_hash` for the same `name`.
 */
function writeProjectTokenHash(project: {
  id: string;
  name: string;
  tokenHash: string;
  githubRepo: string;
  dbName: string;
}): void {
  const sql =
    'INSERT INTO projects (id, name, token_hash, github_repo) ' +
    `VALUES ('${project.id}', '${escapeSqlString(project.name)}', '${project.tokenHash}', ` +
    `'${escapeSqlString(project.githubRepo)}') ` +
    'ON CONFLICT(name) DO UPDATE SET token_hash = excluded.token_hash;';

  const dir = mkdtempSync(join(tmpdir(), 'project-token-'));
  const file = join(dir, 'upsert.sql');
  writeFileSync(file, sql, 'utf8');
  try {
    execFileSync(
      'pnpm',
      ['exec', 'wrangler', 'd1', 'execute', project.dbName, '--remote', `--file=${file}`],
      {
        stdio: 'inherit'
      }
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
