import { Hono } from "hono";
import type { AppEnv } from "../types";

type AccessResponse = {
  user: AppEnv["Variables"]["user"];
  session: AppEnv["Variables"]["session"];
  activeSubscription: NonNullable<
    AppEnv["Variables"]["activeSubscription"]
  > | null;
  isEntitled: boolean;
};

export const accessRoutes = new Hono<AppEnv>().get("/", (c) =>
  c.json<AccessResponse>({
    user: c.get("user"),
    session: c.get("session"),
    activeSubscription: c.get("activeSubscription") ?? null,
    isEntitled: c.get("isEntitled") ?? false
  })
);
