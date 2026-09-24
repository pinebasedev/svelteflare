// Where better-auth's Stripe plugin receives webhooks (`basePath` +
// `/stripe/webhook`). Also read by the stack (`alchemy/Stripe.ts`), which
// registers it with Stripe and exempts it from Access, so this file must stay
// free of imports.
export const STRIPE_WEBHOOK_PATH = "/v1/auth/stripe/webhook";
