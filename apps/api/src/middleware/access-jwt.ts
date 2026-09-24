import type { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { Jwt } from "hono/utils/jwt";
import type { HonoJsonWebKey } from "hono/utils/jwt/types";
import { jsonError } from "../helpers/http";
import { STRIPE_WEBHOOK_PATH } from "../helpers/stripe";
import type { AppEnv } from "../types";

// Cloudflare Access forwards the verified identity as a bare JWT in this
// header (no `Bearer` prefix), so `hono/jwk` doesn't fit.
export const ACCESS_JWT_HEADER = "Cf-Access-Jwt-Assertion";
const JWKS_TTL_MS = 60 * 60 * 1000;

export type AccessJwtConfig = {
  /** Zero Trust team name: `<team>.cloudflareaccess.com`. */
  teamDomain: string;
  /** The Access application's AUD tag; every token must carry it. */
  aud: string;
  /** Test seam: public keys to verify against, skipping the JWKS fetch. */
  keys?: HonoJsonWebKey[];
  /** Test seam: `fetch` for the JWKS request. */
  fetch?: typeof fetch;
};

type KeyCache = { keys: HonoJsonWebKey[]; expiresAt: number };
const keyCaches = new Map<string, KeyCache>();

const loadKeys = async (
  config: AccessJwtConfig,
  jwksUri: string
): Promise<HonoJsonWebKey[]> => {
  if (config.keys) return config.keys;
  const cached = keyCaches.get(jwksUri);
  if (cached && cached.expiresAt > Date.now()) return cached.keys;
  const response = await (config.fetch ?? fetch)(jwksUri);
  if (!response.ok) throw new Error(`JWKS fetch failed (${response.status})`);
  const body = (await response.json()) as { keys?: HonoJsonWebKey[] };
  if (!body.keys) throw new Error("JWKS response has no `keys`");
  keyCaches.set(jwksUri, {
    keys: body.keys,
    expiresAt: Date.now() + JWKS_TTL_MS
  });
  return body.keys;
};

const reject = (c: Context<AppEnv>, reason: string, errorName?: string) => {
  console.warn(
    JSON.stringify({
      type: "access_assertion_rejected",
      level: "warn",
      reason,
      errorName,
      requestId: c.get("requestId")
    })
  );
  return jsonError(c, 401, "UNAUTHORIZED", "Unauthorized");
};

/**
 * Verifies the Cloudflare Access assertion on every request, so the API checks
 * identity itself instead of trusting that Access sat in front of it.
 * A missing, malformed, wrong-audience, expired, or wrongly signed token is a
 * 401. The team's signing keys are fetched once and cached for an hour.
 */
export const createAccessJwtMiddleware = (
  config: AccessJwtConfig
): MiddlewareHandler<AppEnv> => {
  const teamOrigin = `https://${config.teamDomain}.cloudflareaccess.com`;
  const jwksUri = `${teamOrigin}/cdn-cgi/access/certs`;

  return createMiddleware<AppEnv>(async (c, next) => {
    const token = c.req.header(ACCESS_JWT_HEADER);
    if (!token) return reject(c, "missing assertion header");

    try {
      await Jwt.verifyWithJwks(token, {
        keys: await loadKeys(config, jwksUri),
        verification: { aud: config.aud, iss: teamOrigin },
        allowedAlgorithms: ["RS256"]
      });
    } catch (err) {
      // Hono's JWT errors include the raw token in `.message`: log the name only.
      return reject(
        c,
        "verification failed",
        err instanceof Error ? err.name : "UnknownError"
      );
    }

    await next();
  });
};

/**
 * Gates the API only where the stack set both values: the `pr-*` and `staging`
 * stages. `prod` (public) and `alchemy dev` (no Access locally) pass through.
 * Runs after CORS, which answers preflights itself; Access lets those through
 * unauthenticated (`optionsPreflightBypass`), so they never reach this check.
 * The Stripe webhook path is exempt, matching its Access bypass
 * (`alchemy/Access.ts`, `StripeWebhookBypass`): Stripe can't log in to Access,
 * so its requests carry no assertion. Stripe's signature, checked by
 * better-auth, protects it instead.
 */
export const accessJwtMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const { CF_ACCESS_TEAM_DOMAIN: teamDomain, CF_ACCESS_AUD: aud } = c.env;
  if (!teamDomain || !aud || c.req.path === STRIPE_WEBHOOK_PATH) return next();
  return createAccessJwtMiddleware({ teamDomain, aud })(c, next);
});
