import type { AuthInstance, AuthType } from "../auth";

const ENTITLED_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export type AuthUser = AuthType["user"] | null;
export type AuthSession = AuthType["session"] | null;
export type ResolvedAuth = AuthType | null;
export type ActiveSubscription = {
  status: string;
  plan?: string;
} & Record<string, unknown>;

export type AccessState = {
  user: AuthUser;
  session: AuthSession;
  activeSubscription: ActiveSubscription | null;
  isEntitled: boolean;
};

export type SubscriptionState = Omit<AccessState, "user" | "session">;

const toActiveSubscription = (value: unknown): ActiveSubscription | null => {
  if (!value || typeof value !== "object") return null;

  const status = Reflect.get(value, "status");
  if (typeof status !== "string") return null;

  return value as ActiveSubscription;
};

const pickEntitledSubscription = (
  subscriptions: unknown
): ActiveSubscription | null => {
  if (!Array.isArray(subscriptions)) return null;

  for (const subscription of subscriptions) {
    const activeSubscription = toActiveSubscription(subscription);
    if (!activeSubscription) continue;
    if (ENTITLED_SUBSCRIPTION_STATUSES.has(activeSubscription.status)) {
      return activeSubscription;
    }
  }

  return null;
};

const listActiveSubscriptions = async (
  auth: AuthInstance,
  headers: Headers,
  referenceId: string
): Promise<unknown> => {
  const api = auth.api as unknown as {
    listActiveSubscriptions?: (args: {
      query: { referenceId: string };
      headers: Headers;
    }) => Promise<unknown>;
  };

  if (typeof api.listActiveSubscriptions !== "function") return null;

  return api.listActiveSubscriptions({
    query: { referenceId },
    headers
  });
};

export const resolveSession = async (
  auth: AuthInstance,
  headers: Headers
): Promise<ResolvedAuth> => {
  const session = await auth.api.getSession({ headers });
  if (!session?.user || !session.session) {
    return null;
  }

  return session;
};

export const resolveSubscription = async (
  auth: AuthInstance,
  headers: Headers,
  user: AuthUser
): Promise<SubscriptionState> => {
  if (!user?.id) {
    return {
      activeSubscription: null,
      isEntitled: false
    };
  }

  const subscriptions = await listActiveSubscriptions(auth, headers, user.id);

  const activeSubscription = pickEntitledSubscription(subscriptions);

  return {
    activeSubscription,
    isEntitled: activeSubscription !== null
  };
};
