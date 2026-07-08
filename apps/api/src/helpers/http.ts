import type { Context } from "hono";
import type { AppEnv } from "../types";

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    requestId: string;
    issues?: unknown;
  };
};

export const getRequestId = (c: Context<AppEnv>): string => c.get("requestId");

export const jsonOk = <T extends object>(c: Context<AppEnv>, body?: T) => {
  return c.json(body ?? ({ ok: true } as T));
};

export const jsonError = (
  c: Context<AppEnv>,
  status: number,
  code: string,
  message: string,
  issues?: unknown
) => {
  return c.json<ErrorBody>(
    {
      error: {
        code,
        message,
        requestId: getRequestId(c),
        ...(issues !== undefined ? { issues } : {})
      }
    },
    {
      status: status as
        400 | 401 | 403 | 404 | 405 | 408 | 413 | 429 | 500 | 504
    }
  );
};

export const getErrorCodeForStatus = (status: number): string => {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 405:
      return "METHOD_NOT_ALLOWED";
    case 408:
      return "REQUEST_TIMEOUT";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    case 429:
      return "RATE_LIMITED";
    case 500:
    default:
      return "INTERNAL_SERVER_ERROR";
  }
};

export const isUnsafeMethod = (method: string): boolean =>
  !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
