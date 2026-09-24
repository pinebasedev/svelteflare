import { every } from "hono/combine";
import { Hono, type Context } from "hono";
import type { AppEnv } from "../types";
import { accessJwtMiddleware } from "../middleware/access-jwt";
import { requireAuthenticated } from "../middleware/authorization";
import { csrfMiddleware } from "../middleware/csrf";
import { authMiddleware, type AppTestOverrides } from "../middleware/auth";
import { bodyLimitMiddleware } from "../middleware/body-limit";
import { corsMiddleware } from "../middleware/cors";
import { rateLimitMiddleware } from "../middleware/rate-limit";
import { subscriptionMiddleware } from "../middleware/subscription";
import { timeoutMiddleware } from "../middleware/timeout";
import { accessRoutes } from "./access";
import { authRoutes } from "./auth";
import { healthRoutes } from "./health";

export const createAppRoutes = (options: AppTestOverrides = {}) => {
  const shouldSkipOptions = (c: Context<AppEnv>) =>
    c.req.method.toUpperCase() === "OPTIONS";
  const rateLimitOptions = { shouldSkip: shouldSkipOptions };

  const baseRouteMiddleware = every(
    timeoutMiddleware(options.timeouts?.ms ?? 30_000),
    corsMiddleware,
    accessJwtMiddleware,
    bodyLimitMiddleware,
    authMiddleware(options),
    subscriptionMiddleware(options),
    rateLimitMiddleware(rateLimitOptions)
  );

  const authenticatedRouteMiddleware = every(requireAuthenticated);
  // Uncomment when adding subscription-gated routes:
  // const entitledRouteMiddleware = every(requireAuthenticated, requireEntitled);

  const publicRoutes = new Hono<AppEnv>()
    .route("/health", healthRoutes)
    .route("/access", accessRoutes);

  const authenticatedRoutes = new Hono<AppEnv>().use(
    "*",
    authenticatedRouteMiddleware
  );

  const appRoutes = new Hono<AppEnv>()
    .use("*", csrfMiddleware)
    .route("/", publicRoutes)
    .route("/", authenticatedRoutes);

  const baseRoutes = new Hono<AppEnv>()
    .use("*", baseRouteMiddleware)
    .route("/auth", authRoutes)
    .route("/", appRoutes);

  return new Hono<AppEnv>().route("/", baseRoutes);
};
