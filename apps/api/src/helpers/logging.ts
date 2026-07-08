import type { Context } from "hono";
import type { AppEnv } from "../types";

export const logApiError = (
  c: Context<AppEnv>,
  err: unknown,
  status: number
) => {
  if (status < 500) {
    return;
  }

  const userId = c.get("user")?.id ?? null;
  const payload = {
    type: "api_error",
    level: "error" as const,
    status,
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    userId,
    error:
      err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            stack: err.stack?.split("\n").slice(0, 5)
          }
        : { value: String(err) }
  };

  console.error(JSON.stringify(payload));
};
