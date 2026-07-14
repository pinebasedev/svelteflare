import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export const load = () => {
  if (!dev) {
    redirect(307, '/');
  }
};
