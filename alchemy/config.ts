import * as Config from 'effect/Config';

/**
 * Deploy-time config values with a dev fallback, so `alchemy dev` and
 * `check:alchemy` run without a populated `.env`.
 */
export const stringOr = (name: string, fallback: string): Config.Config<string> =>
  Config.String(name).pipe(Config.withDefault(fallback));

/** A secret with a dev-only fallback, so `alchemy dev` runs without a `.env`. */
export const devSecret = (name: string) =>
  Config.Redacted(name).pipe(Config.withDefault(`dev-only-${name.toLowerCase()}`));

/** An optional secret; empty when unset (the API treats empty as "feature off"). */
export const optionalSecret = (name: string) => Config.Redacted(name).pipe(Config.withDefault(''));
