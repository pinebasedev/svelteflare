import { PUBLIC_API_URL } from '$env/static/public';
import { createAuthClient } from 'better-auth/svelte';
import { emailOTPClient } from 'better-auth/client/plugins';
import { stripeClient } from '@better-auth/stripe/client';

export const authClient = createAuthClient({
  baseURL: PUBLIC_API_URL,
  basePath: '/v1/auth',
  plugins: [
    emailOTPClient(),
    stripeClient({
      subscription: true
    })
  ]
});
