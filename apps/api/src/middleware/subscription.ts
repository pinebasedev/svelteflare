import { createMiddleware } from "hono/factory";
import { resolveSubscription } from "../helpers/access";
import type { AppEnv } from "../types";
import type { SubscriptionMiddlewareOverrides } from "./auth";

export const subscriptionMiddleware = (
  options: SubscriptionMiddlewareOverrides = {}
) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const subscriptionState = await (
      options.resolveSubscription ?? resolveSubscription
    )(c.get("auth"), c.req.raw.headers, c.get("user"));

    c.set("activeSubscription", subscriptionState.activeSubscription);
    c.set("isEntitled", subscriptionState.isEntitled);
    await next();
  });
