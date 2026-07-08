import { createMiddleware } from "hono/factory";
import type { AuthInstance } from "../auth";
import { getAuth } from "../auth";
import { resolveSession, resolveSubscription } from "../helpers/access";
import { getDb, type Db } from "../db/database";
import type { AppBindings, AppEnv } from "../types";

export type AuthMiddlewareOverrides = {
  createDb?: (env: AppBindings) => Db;
  createAuth?: (db: Db, env: AppBindings) => AuthInstance;
  resolveSession?: typeof resolveSession;
};

export type SubscriptionMiddlewareOverrides = {
  resolveSubscription?: typeof resolveSubscription;
};

export type AppTestOverrides = AuthMiddlewareOverrides &
  SubscriptionMiddlewareOverrides & {
    fetchImpl?: typeof fetch;
    timeouts?: {
      ms?: number;
    };
  };

export const authMiddleware = (options: AuthMiddlewareOverrides = {}) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const db = (options.createDb ?? getDb)(c.env);
    const auth = (options.createAuth ?? getAuth)(db, c.env);
    const resolvedAuth = await (options.resolveSession ?? resolveSession)(
      auth,
      c.req.raw.headers
    );

    c.set("db", db);
    c.set("auth", auth);
    c.set("user", resolvedAuth?.user ?? null);
    c.set("session", resolvedAuth?.session ?? null);
    await next();
  });
