import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";
import { getErrorCodeForStatus, jsonError } from "./helpers/http";
import { logApiError } from "./helpers/logging";
import { type AppTestOverrides } from "./middleware/auth";
import { createAppRoutes } from "./routes";
import type { AppEnv } from "./types";

const secureHeadersMiddleware = secureHeaders();
const defaultRoutes = createAppRoutes();

export const createApp = (options: AppTestOverrides = {}) => {
  const app = new Hono<AppEnv>();

  app.use("*", requestId({ headerName: "x-request-id" }));
  app.use("*", secureHeadersMiddleware);

  app.onError((err, c) => {
    const status = err instanceof HTTPException ? err.status : 500;
    logApiError(c, err, status);

    return jsonError(
      c,
      status,
      getErrorCodeForStatus(status),
      err instanceof HTTPException ? err.message : "Internal Server Error"
    );
  });

  app.route(
    "/v1",
    options === defaultOptions ? defaultRoutes : createAppRoutes(options)
  );

  app.notFound((c) => jsonError(c, 404, "NOT_FOUND", "Route not found"));

  return app;
};

const defaultOptions: AppTestOverrides = {};
const app = createApp(defaultOptions);

export type AppType = typeof defaultRoutes;

export default app;
