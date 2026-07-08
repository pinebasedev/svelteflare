import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";
import { jsonError } from "../helpers/http";

export const requireAuthenticated = createMiddleware<AppEnv>(
  async (c, next) => {
    if (!c.get("session")) {
      return jsonError(c, 401, "UNAUTHORIZED", "Authentication required");
    }

    await next();
  }
);

export const requireEntitled = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.get("isEntitled")) {
    return jsonError(c, 403, "FORBIDDEN", "Active subscription required");
  }

  await next();
});
