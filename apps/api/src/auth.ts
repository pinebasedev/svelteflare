import { stripe, type StripePlan } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { emailOTP } from "better-auth/plugins/email-otp";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import type { Db } from "./db/database";
import { plan, user as userTable } from "./db/schema";
import { sendResetEmail, sendVerificationOtpEmail } from "./helpers/email";
import { getAllowedOrigin } from "./helpers/origins";
import type { AppBindings } from "./types";

let instance: ReturnType<typeof betterAuth> | undefined;

export const getAuth = (
  db: Db,
  env: AppBindings
): ReturnType<typeof betterAuth> => {
  if (instance) {
    return instance;
  }

  const betterAuthOrigin = env.PUBLIC_BETTER_AUTH_URL
    ? new URL(env.PUBLIC_BETTER_AUTH_URL).origin
    : "http://localhost:9003";
  const allowedOrigin = getAllowedOrigin(env);

  const stripePlugin = env.STRIPE_SECRET_KEY
    ? stripe({
        stripeClient: new Stripe(env.STRIPE_SECRET_KEY, {
          apiVersion: "2026-06-24.dahlia"
        }),
        stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
        createCustomerOnSignUp: true,
        subscription: {
          enabled: true,
          getCheckoutSessionParams: async () => ({
            params: {
              billing_address_collection: "required",
              allow_promotion_codes: true
            }
          }),
          plans: async (): Promise<StripePlan[]> => {
            const plans = await db.select().from(plan);
            return plans.map((currentPlan) => ({
              name: currentPlan.name,
              priceId: currentPlan.priceId,
              annualDiscountPriceId: currentPlan.annualDiscountPriceId,
              ...(currentPlan.freeTrialDays > 0
                ? {
                    freeTrial: {
                      days: currentPlan.freeTrialDays,
                      onTrialStart: async () => {},
                      onTrialEnd: async () => {},
                      onTrialExpired: async () => {}
                    }
                  }
                : {})
            })) as StripePlan[];
          }
        }
      })
    : null;

  instance = betterAuth({
    telemetry: { enabled: false },
    baseURL: betterAuthOrigin,
    basePath: "/v1/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: allowedOrigin ? [allowedOrigin] : [],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") {
          const email = (ctx.body as { email?: string } | undefined)?.email;
          if (email) {
            const existing = await db
              .select({ emailVerified: userTable.emailVerified })
              .from(userTable)
              .where(eq(userTable.email, email.toLowerCase()))
              .get();
            if (existing?.emailVerified) {
              throw new APIError("UNPROCESSABLE_ENTITY", {
                message: "Email already in use."
              });
            }
          }
        }
      })
    },
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: env.PUBLIC_GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        disableImplicitSignUp: true
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: true,
      expiresIn: 3600
    },
    database: drizzleAdapter(db, { provider: "sqlite" }),
    session: {
      cookieCache: {
        enabled: true,
        strategy: "compact",
        maxAge: 5 * 60,
        refreshCache: false
      }
    },
    advanced: {
      crossSubDomainCookies: {
        enabled: true
      }
    },
    plugins: [
      ...(stripePlugin ? [stripePlugin] : []),
      emailOTP({
        overrideDefaultEmailVerification: true,
        otpLength: 6,
        expiresIn: 900,
        sendVerificationOTP: async ({ email, otp, type }) => {
          if (type !== "email-verification") return;
          await sendVerificationOtpEmail(env, email, otp);
        }
      })
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendResetEmail(env, user.name, user.email, url);
      }
    }
  }) as unknown as ReturnType<typeof betterAuth>;

  return instance!;
};

export type AuthInstance = ReturnType<typeof getAuth>;
export type AuthType = {
  user: AuthInstance["$Infer"]["Session"]["user"] | null;
  session: AuthInstance["$Infer"]["Session"]["session"] | null;
};
