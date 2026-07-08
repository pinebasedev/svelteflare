import { stripe, type StripePlan } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins/email-otp";
import Stripe from "stripe";
import type { Db } from "./db/database";
import { plan } from "./db/schema";
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

  const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-06-24.dahlia"
  });

  const betterAuthOrigin = new URL(env.PUBLIC_BETTER_AUTH_URL).origin;
  const allowedOrigin = getAllowedOrigin(env);

  instance = betterAuth({
    telemetry: { enabled: false },
    baseURL: betterAuthOrigin,
    basePath: "/v1/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: allowedOrigin ? [allowedOrigin] : [],
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
      stripe({
        stripeClient,
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
              freeTrial: {
                days: currentPlan.freeTrialDays,
                onTrialStart: async () => {},
                onTrialEnd: async () => {},
                onTrialExpired: async () => {}
              }
            })) as StripePlan[];
          }
        }
      }),
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
