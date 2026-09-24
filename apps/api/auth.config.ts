// Config for the Better Auth CLI only (`pnpm generate:auth`), never imported
// by the Worker. The CLI needs a module-level `auth` instance, but the real one
// in `src/auth.ts` is built per request from the Worker's `env`. So this file
// repeats just the options that shape the database schema (the adapter and the
// plugins). Keep it in step with `src/auth.ts`.
import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { emailOTP } from "better-auth/plugins/email-otp";
import Stripe from "stripe";

export const auth = betterAuth({
  database: drizzleAdapter({}, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  plugins: [
    stripe({
      stripeClient: new Stripe("sk_test_cli_placeholder"),
      stripeWebhookSecret: "",
      subscription: { enabled: true, plans: [] }
    }),
    emailOTP({ sendVerificationOTP: async () => {} })
  ]
});
