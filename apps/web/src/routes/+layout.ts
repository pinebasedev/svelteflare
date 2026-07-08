import { PUBLIC_APP_URL } from '$env/static/public';
import { createApiClient, type AccessPayload } from '$lib/api';
import type { LayoutLoad } from './$types';

const DEFAULT_ACCESS: AccessPayload = {
  user: null,
  session: null,
  activeSubscription: null,
  isEntitled: false
};

const DEFAULT_SEO = {
  seoTitle: 'YourApp',
  seoDescription: 'Your app description.',
  ogImage: null
};

const loadAccess = async (fetchImpl: typeof fetch): Promise<AccessPayload> => {
  try {
    const response = await createApiClient(fetchImpl).access.$get();
    if (!response.ok) return DEFAULT_ACCESS;

    return {
      ...DEFAULT_ACCESS,
      ...(await response.json())
    };
  } catch {
    return DEFAULT_ACCESS;
  }
};

export const ssr = false;

export const load: LayoutLoad = async ({ fetch, url, depends }) => {
  depends('auth:session');

  return {
    ...DEFAULT_SEO,
    canonical_url: `${PUBLIC_APP_URL}${url.pathname}`,
    ...(await loadAccess(fetch))
  };
};
