import { csrf } from "hono/csrf";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { isAllowedOrigin } from "../helpers/origins";
import type { AppEnv } from "../types";
import { jsonError } from "../helpers/http";

const csrfHandler = csrf({
  origin: (origin, c) => isAllowedOrigin(c.env, origin),
  secFetchSite: ["none", "same-origin", "same-site"]
});

export const csrfMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  try {
    await csrfHandler(c, next);
  } catch (error) {
    if (error instanceof HTTPException && error.status === 403) {
      return jsonError(c, 403, "CSRF_REJECTED", "Cross-site request rejected");
    }
    throw error;
  }
});
