import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import type { AppBindings, AppEnv } from "../types";
import { jsonError } from "../helpers/http";

export type RateLimitResult = {
  success: boolean;
  remaining?: number;
  limit?: number;
  reset?: number;
};

export type RateLimitBinding = {
  limit(input: { key: string }): Promise<RateLimitResult>;
};

type RateLimitContext = Parameters<MiddlewareHandler<AppEnv>>[0];
type BindingKey = keyof Pick<
  AppBindings,
  "FREE_RATE_LIMITER" | "PREMIUM_RATE_LIMITER"
>;

type KeyResolver = (c: RateLimitContext) => string | Promise<string>;
type SkipResolver = (c: RateLimitContext) => boolean;
type BindingKeyResolver = (c: RateLimitContext) => BindingKey;
type RateLimitOptions = {
  bindingKey?: BindingKey;
  bindingKeyResolver?: BindingKeyResolver;
  keyResolver?: KeyResolver;
  shouldSkip?: SkipResolver;
};

export const getClientIp = (c: RateLimitContext) =>
  c.req.header("cf-connecting-ip") ??
  c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
  "anonymous";

const getAppBindingKey = (c: RateLimitContext): BindingKey =>
  c.get("isEntitled") === true ? "PREMIUM_RATE_LIMITER" : "FREE_RATE_LIMITER";

const getAppRateLimitKey = (c: RateLimitContext): string => {
  const userId = c.get("user")?.id;
  if (userId) return userId;

  return `anonymous:${getClientIp(c)}`;
};

export const rateLimitMiddleware = (options: RateLimitOptions = {}) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (options.shouldSkip?.(c)) {
      await next();
      return;
    }

    const bindingKey =
      options.bindingKeyResolver?.(c) ??
      options.bindingKey ??
      getAppBindingKey(c);
    const limiter = c.env[bindingKey] as RateLimitBinding | undefined;
    if (!limiter) {
      await next();
      return;
    }

    const key = await (options.keyResolver?.(c) ?? getAppRateLimitKey(c));

    const result = await limiter.limit({ key });
    if (result.limit !== undefined)
      c.header("x-ratelimit-limit", String(result.limit));
    if (result.remaining !== undefined)
      c.header("x-ratelimit-remaining", String(result.remaining));
    if (result.reset !== undefined)
      c.header("x-ratelimit-reset", String(result.reset));

    if (!result.success) {
      return jsonError(c, 429, "RATE_LIMITED", "Too many requests");
    }

    await next();
  });
