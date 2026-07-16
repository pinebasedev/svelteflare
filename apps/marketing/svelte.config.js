import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: '404.html',
      precompress: false,
      strict: true
    }),
    paths: {
      relative: false
    }
  },
  alias: {
    '@repo/ui/*': path.resolve('../../packages/ui/src')
  }
};

export default config;
