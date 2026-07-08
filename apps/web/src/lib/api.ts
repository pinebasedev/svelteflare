import { PUBLIC_API_URL } from '$env/static/public';
import { hc } from 'hono/client';
import type { AppType } from '../../../api/src/index.js';

type FetchLike = typeof fetch;

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

const API_BASE_URL = `${normalizeBaseUrl(PUBLIC_API_URL)}/v1`;

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const apiUrl = (path: string) => `${API_BASE_URL}${normalizePath(path)}`;

export const createApiClient = (fetchImpl: FetchLike = fetch) =>
  hc<AppType>(API_BASE_URL, {
    fetch: fetchImpl,
    init: {
      credentials: 'include'
    }
  });

export const apiClient = createApiClient();

export const apiFetch = (path: string, init: RequestInit = {}, fetchImpl: FetchLike = fetch) => {
  const { credentials, ...rest } = init;

  return fetchImpl(apiUrl(path), {
    ...rest,
    credentials: credentials ?? 'include'
  });
};

export type AccessPayload = {
  user: { id: string; name: string; email: string } | null;
  session: { id: string } | null;
  activeSubscription: { status: string; plan?: string } | null;
  isEntitled: boolean;
};
