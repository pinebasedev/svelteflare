export const SITE_NAME = 'Svelteflare';
export const SITE_URL = 'https://svelteflare.com';
export const GITHUB_URL = 'https://github.com/pinebasedev/svelteflare';
export const SEO_TITLE = 'SvelteKit and Cloudflare SaaS boilerplate - Svelteflare';
export const SEO_DESCRIPTION =
  'An open-source, production-ready SaaS boilerplate with a SvelteKit SPA, typed Hono API, Better Auth, Stripe subscriptions, and a themed component library, deployed on Cloudflare Workers with Alchemy.';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: SEO_DESCRIPTION
    },
    {
      '@type': 'SoftwareSourceCode',
      name: SITE_NAME,
      description: SEO_DESCRIPTION,
      url: SITE_URL,
      codeRepository: GITHUB_URL,
      programmingLanguage: 'TypeScript',
      license: 'https://opensource.org/licenses/MIT',
      runtimePlatform: 'Cloudflare Workers'
    }
  ]
};
