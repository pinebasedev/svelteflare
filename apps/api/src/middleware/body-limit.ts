import { createMiddleware } from "hono/factory";
import { bodyLimit } from "hono/body-limit";
import type { AppEnv } from "../types";
import { jsonError } from "../helpers/http";

const bodyLimitHandler = bodyLimit({
  maxSize: 64 * 1024,
  onError: (c) =>
    jsonError(c, 413, "PAYLOAD_TOO_LARGE", "Request body too large")
});

export const bodyLimitMiddleware = createMiddleware<AppEnv>((c, next) =>
  bodyLimitHandler(c, next)
);
