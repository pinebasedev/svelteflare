import { createMiddleware } from "hono/factory";
import { cors } from "hono/cors";
import type { AppEnv } from "../types";
import { isAllowedOrigin } from "../helpers/origins";

const corsHandler = cors({
  origin: (origin, c) => {
    if (!origin) return null;
    return isAllowedOrigin(c.env, origin) ? origin : null;
  },
  allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token"
  ],
  exposeHeaders: ["x-request-id"],
  credentials: true,
  maxAge: 600
});

export const corsMiddleware = createMiddleware<AppEnv>((c, next) =>
  corsHandler(c, next)
);
