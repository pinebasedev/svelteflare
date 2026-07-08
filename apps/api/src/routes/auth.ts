import { Hono } from "hono";
import type { AppEnv } from "../types";

export const authRoutes = new Hono<AppEnv>().on(["POST", "GET"], "/*", (c) =>
  c.get("auth").handler(c.req.raw)
);
