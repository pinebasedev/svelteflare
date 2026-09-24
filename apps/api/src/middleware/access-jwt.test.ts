import { Hono } from "hono";
import { Jwt } from "hono/utils/jwt";
import type { HonoJsonWebKey } from "hono/utils/jwt/types";
import { beforeAll, describe, expect, it } from "vitest";
import { STRIPE_WEBHOOK_PATH } from "../helpers/stripe";
import type { AppEnv } from "../types";
import {
  ACCESS_JWT_HEADER,
  accessJwtMiddleware,
  createAccessJwtMiddleware
} from "./access-jwt";

const teamDomain = "acme";
const aud = "aud-tag";
const iss = `https://${teamDomain}.cloudflareaccess.com`;

let privateKey: HonoJsonWebKey;
let publicKey: HonoJsonWebKey;

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["sign", "verify"]
  )) as CryptoKeyPair;
  privateKey = {
    ...(await crypto.subtle.exportKey("jwk", pair.privateKey)),
    kid: "k1"
  } as HonoJsonWebKey;
  publicKey = {
    ...(await crypto.subtle.exportKey("jwk", pair.publicKey)),
    kid: "k1",
    alg: "RS256"
  } as HonoJsonWebKey;
});

const token = (claims: Record<string, unknown>) =>
  Jwt.sign(
    { iss, aud, exp: Math.floor(Date.now() / 1000) + 60, ...claims },
    privateKey,
    "RS256"
  );

const app = () =>
  new Hono<AppEnv>()
    .use("*", createAccessJwtMiddleware({ teamDomain, aud, keys: [publicKey] }))
    .get("/", (c) => c.text("ok"));

describe("createAccessJwtMiddleware", () => {
  it("lets a valid assertion through", async () => {
    const res = await app().request("/", {
      headers: { [ACCESS_JWT_HEADER]: await token({}) }
    });
    expect(res.status).toBe(200);
  });

  it("rejects a missing assertion", async () => {
    const res = await app().request("/");
    expect(res.status).toBe(401);
  });

  it("rejects another application's audience", async () => {
    const res = await app().request("/", {
      headers: { [ACCESS_JWT_HEADER]: await token({ aud: "other-app" }) }
    });
    expect(res.status).toBe(401);
  });

  it("rejects an expired assertion", async () => {
    const res = await app().request("/", {
      headers: {
        [ACCESS_JWT_HEADER]: await token({
          exp: Math.floor(Date.now() / 1000) - 60
        })
      }
    });
    expect(res.status).toBe(401);
  });
});

describe("accessJwtMiddleware", () => {
  const gatedEnv = { CF_ACCESS_TEAM_DOMAIN: teamDomain, CF_ACCESS_AUD: aud };
  const gatedApp = () =>
    new Hono<AppEnv>()
      .use("*", accessJwtMiddleware)
      .all("*", (c) => c.text("ok"));

  it("gates every other path on a gated stage", async () => {
    const res = await gatedApp().request("/v1/auth/get-session", {}, gatedEnv);
    expect(res.status).toBe(401);
  });

  it("exempts only the exact Stripe webhook path", async () => {
    const webhook = await gatedApp().request(
      STRIPE_WEBHOOK_PATH,
      { method: "POST" },
      gatedEnv
    );
    expect(webhook.status).toBe(200);
    const nearby = await gatedApp().request(
      `${STRIPE_WEBHOOK_PATH}/x`,
      { method: "POST" },
      gatedEnv
    );
    expect(nearby.status).toBe(401);
  });

  it("passes through when the stage isn't gated", async () => {
    const res = await new Hono<AppEnv>()
      .use("*", accessJwtMiddleware)
      .get("/", (c) => c.text("ok"))
      .request("/", {}, {});
    expect(res.status).toBe(200);
  });
});
