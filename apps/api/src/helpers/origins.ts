import type { AppBindings } from "../types";

const toOrigin = (value: string | null | undefined): string | null => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const getAllowedOrigin = (env: AppBindings): string | null =>
  toOrigin(env.PUBLIC_ORIGIN_ALLOWLIST);

export const isAllowedOrigin = (
  env: AppBindings,
  origin: string | null
): boolean => origin !== null && origin === getAllowedOrigin(env);

export const resolveAllowedOrigin = (
  env: AppBindings,
  requestOrigin: string | null
): string | null => {
  const allowedOrigin = getAllowedOrigin(env);
  return requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin;
};
