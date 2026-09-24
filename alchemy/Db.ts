import { RemovalPolicy } from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';

/**
 * The API's D1 database. Alchemy reads drizzle-kit v1's folder layout
 * (`<timestamp>_<name>/migration.sql`) and applies pending migrations on every
 * deploy, and under `alchemy dev` against the local simulator.
 *
 * `prod`'s database is retained on destroy: `alchemy destroy --stage prod` drops
 * it from Alchemy's state but never deletes the users' data.
 */
export const Database = (stage: string) =>
  Cloudflare.D1.Database('db', { migrations: './apps/api/migrations' }).pipe(
    RemovalPolicy.retain(stage === 'prod')
  );
