import svelteLint from '@repo/lint/eslint';
import svelteConfig from './svelte.config.js';

export default svelteLint({ svelteConfig, theme: true });
