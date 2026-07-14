import noHardcodedColors from './rules/no-hardcoded-colors.js';

/**
 * Theme color guard: feature code must use the semantic theme tokens from
 * packages/ui/src/global.css. Apply in apps that consume the theme (apps/web);
 * packages/ui itself and theme overlays are exempt by not including it.
 *
 * @type {import('eslint').Linter.Config}
 */
export default {
  files: ['src/**/*.svelte', 'src/**/*.svelte.ts', 'src/**/*.svelte.js', 'src/**/*.ts'],
  plugins: {
    theme: {
      rules: { 'no-hardcoded-colors': noHardcodedColors }
    }
  },
  rules: {
    'theme/no-hardcoded-colors': 'error'
  }
};
