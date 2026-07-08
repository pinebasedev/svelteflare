import type { betterAuth } from "better-auth";
import type {
  ActiveSubscription,
  AuthSession,
  AuthUser
} from "./helpers/access";
import type { Db } from "./db/database";

export type AppBindings = Env & {
  EMAIL: SendEmail;
  EMAIL_FROM_ADDRESS: string;
  EMAIL_FROM_NAME: string;
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
