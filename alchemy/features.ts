import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

/**
 * The optional features and whether this deploy has what each needs, so a
 * deploy says what's off and how to turn it on instead of leaving it to be
 * found in the app. Only presence is checked; no value is ever printed.
 * (Effect's `Config` treats an empty variable, which is what GitHub Actions
 * passes for an unset secret, as unset.)
 */
export type Feature = { name: string; on: boolean; detail: string };

const isSet = (name: string) =>
  Effect.gen(function* () {
    return Option.isSome(yield* Config.option(Config.Redacted(name)));
  });

export const optionalFeatures = (emailFrom: string | undefined) =>
  Effect.gen(function* () {
    const googleOn =
      (yield* isSet('PUBLIC_GOOGLE_CLIENT_ID')) && (yield* isSet('GOOGLE_CLIENT_SECRET'));
    const billingOn = yield* isSet('STRIPE_SECRET_KEY');
    const webhooksOn = yield* isSet('STRIPE_API_KEY');

    const features: Feature[] = [
      {
        name: 'Email',
        on: Boolean(emailFrom),
        detail: emailFrom
          ? `sends from ${emailFrom}`
          : "emails are skipped, so email sign-up can't be finished (no verification " +
            'code). Onboard a domain to Cloudflare Email Service and set EMAIL_FROM_ADDRESS ' +
            '(README, "Email").'
      },
      {
        name: 'Google sign-in',
        on: googleOn,
        detail: googleOn
          ? 'on'
          : 'set PUBLIC_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (README, "Google sign-in").'
      },
      {
        name: 'Stripe billing',
        on: billingOn,
        detail: billingOn ? 'on' : 'set STRIPE_SECRET_KEY (README, "Stripe").'
      },
      {
        name: 'Stripe webhooks',
        on: webhooksOn,
        detail: webhooksOn
          ? 'endpoint registered for this stage'
          : 'set STRIPE_API_KEY to register this stage\'s endpoint (README, "Stripe").'
      }
    ];
    return features;
  });

/** One line per feature, for the deploy log. */
export const formatFeatures = (stage: string, features: Feature[]) =>
  [
    `Optional features on ${stage}:`,
    ...features.map(({ name, on, detail }) => `  ${on ? '✓' : '✗'} ${name}: ${detail}`)
  ].join('\n');
