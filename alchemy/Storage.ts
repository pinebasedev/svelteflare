import { RemovalPolicy } from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';

/**
 * The API's R2 bucket (`STORAGE` binding). Ephemeral `pr-*` stages set
 * `forceDestroy`, so a closed PR's teardown removes the bucket even with files
 * in it. `prod`'s bucket is retained on destroy, like its database.
 */
export const Storage = (stage: string) =>
  Cloudflare.R2.Bucket('storage', { forceDestroy: stage.startsWith('pr-') }).pipe(
    RemovalPolicy.retain(stage === 'prod')
  );
