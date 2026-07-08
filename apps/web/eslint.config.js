import config from '@repo/eslint-config/index.js';
import svelteConfig from './svelte.config.js';

export default [
  ...config,
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        svelteConfig
      }
    }
  }
];
