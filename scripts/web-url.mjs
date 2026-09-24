// Prints the web app's URL for $STAGE: the one alchemy.run.ts builds it for.
import { workersDevOrigin } from '../alchemy/project.ts';

const { STAGE, PROD_APP_DOMAIN, CLOUDFLARE_WORKERS_SUBDOMAIN } = process.env;
console.log(
  STAGE === 'prod' && PROD_APP_DOMAIN
    ? `https://${PROD_APP_DOMAIN}`
    : workersDevOrigin('web', STAGE, CLOUDFLARE_WORKERS_SUBDOMAIN)
);
