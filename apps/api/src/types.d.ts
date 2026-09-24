import type { betterAuth } from "better-auth";
import type {
  ActiveSubscription,
  AuthSession,
  AuthUser
} from "./helpers/access";
import type { Db } from "./db/database";

// Written by hand to match the `env` in `alchemy/Api.ts`; keep the two in sync.
export type AppBindings = {
  DB: D1Database;
  STORAGE: R2Bucket;
  // Absent on stages without the binding; the rate-limit middleware and
  // `helpers/email.ts` skip their work when it's missing.
  FREE_RATE_LIMITER?: RateLimit;
  PREMIUM_RATE_LIMITER?: RateLimit;
  EMAIL?: SendEmail;

  PUBLIC_API_URL: string;
  PUBLIC_BETTER_AUTH_URL: string;
  PUBLIC_ORIGIN_ALLOWLIST: string;
  PUBLIC_GOOGLE_CLIENT_ID: string;
  EMAIL_FROM_ADDRESS: string;
  EMAIL_FROM_NAME: string;
  // Set on `pr-*` and `staging` only: the API then verifies the Cloudflare
  // Access assertion on every request (`middleware/access-jwt.ts`).
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;

  BETTER_AUTH_SECRET: string;
  GOOGLE_CLIENT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
};

export type AppVariables = {
  db: Db;
  auth: ReturnType<typeof betterAuth>;
  user: AuthUser;
  session: AuthSession;
  activeSubscription?: ActiveSubscription | null;
  isEntitled?: boolean;
  requestId: string;
};

export type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};
