import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { timeout } from "hono/timeout";
import { jsonError } from "../helpers/http";
import type { AppEnv } from "../types";

export const timeoutMiddleware = (
  durationMs: number,
  message = "Request timed out"
) =>
  createMiddleware<AppEnv>(async (c, next) => {
    try {
      await timeout(
        durationMs,
        () =>
          new HTTPException(408, {
            res: jsonError(c, 408, "REQUEST_TIMEOUT", message)
          })
      )(c, next);
    } catch (error) {
      if (error instanceof HTTPException && error.status === 408) {
        return jsonError(c, 408, "REQUEST_TIMEOUT", message);
      }

      throw error;
    }
  });
