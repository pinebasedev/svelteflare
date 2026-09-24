import { RemovalPolicy } from 'alchemy';
import * as Stripe from 'alchemy/Stripe';
import { APP } from './project.ts';

/** Where better-auth's Stripe plugin receives webhooks (`basePath` + `/stripe/webhook`). */
export const STRIPE_WEBHOOK_PATH = '/v1/auth/stripe/webhook';

/**
 * The stage's Stripe webhook endpoint, registered against its API. Its signing
 * secret (returned by Stripe only at creation, kept in Alchemy state) becomes
 * the API's `STRIPE_WEBHOOK_SECRET`, so nobody copies it by hand.
 *
 *   - `pr-*`: created with the PR, deleted when it closes.
 *   - `staging`: created once; its URL never changes, so it's never touched again.
 *   - `prod`: created once, in live mode; retained even on `alchemy destroy`,
 *     since real payments depend on it.
 *
 * `pr-*` and `staging` share one Stripe sandbox, so each endpoint also receives
 * the others' events. better-auth only acts on subscriptions in its own
 * database, so those are ignored.
 *
 * Alchemy authenticates with `STRIPE_API_KEY`, separate from the API's
 * `STRIPE_SECRET_KEY`: in live mode, use a restricted key that can only write
 * webhook endpoints.
 */
export const StripeWebhook = (stage: string, apiUrl: string) =>
  Stripe.WebhookEndpoint('stripe-webhook', {
    url: `${apiUrl}${STRIPE_WEBHOOK_PATH}`,
    // Only what better-auth's Stripe plugin handles.
    enabledEvents: [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ],
    description: `${APP} ${stage}`
  }).pipe(RemovalPolicy.retain(stage === 'prod'));
