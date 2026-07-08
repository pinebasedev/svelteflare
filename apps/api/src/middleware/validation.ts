import { zValidator, type Hook } from "@hono/zod-validator";
import type { Context, Env, ValidationTargets } from "hono";
import type { AppEnv } from "../types";
import { jsonError } from "../helpers/http";

export const validationHook = <Target extends keyof ValidationTargets>(
  target: Target
): Hook<unknown, Env, string, Target> => {
  return (result, c) => {
    if (result.success) return;
    return jsonError(
      c as Context<AppEnv>,
      400,
      "VALIDATION_ERROR",
      `Invalid ${target} payload`,
      result.error?.issues
    );
  };
};

export { zValidator };
