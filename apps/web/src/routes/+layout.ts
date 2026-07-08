import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { PUBLIC_APP_URL, PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST } from '$env/static/public';
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

  if (browser && !posthog.__loaded) {
    posthog.init(PUBLIC_POSTHOG_KEY, {
      api_host: PUBLIC_POSTHOG_HOST,
      advanced_disable_feature_flags: true,
      capture_pageview: false,
      capture_pageleave: false,
      capture_exceptions: false,
      capture_heatmaps: false,
      disable_conversations: true,
      disable_product_tours: true,
      disable_surveys: true,
      disable_web_experiments: true
    });
  }

  return {
    ...DEFAULT_SEO,
    canonical_url: `${PUBLIC_APP_URL}${url.pathname}`,
    ...(await loadAccess(fetch))
  };
};
