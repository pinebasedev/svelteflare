import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import noHardcodedColors from './rules/no-hardcoded-colors.js';

/**
 * ESLint lints .svelte files only: oxlint (root .oxlintrc.json) handles every
 * other file and the <script> rules, but can't see Svelte markup. What's left
 * for ESLint is eslint-plugin-svelte and the markup guardrails below.
 *
 * @param {{ svelteConfig?: object, theme?: boolean }} options `theme` turns on
 *   the theme guardrails (apps that consume the theme; not packages/ui).
 * @returns {import('eslint').Linter.Config[]}
 */
export default function svelteLint({ svelteConfig, theme = false } = {}) {
  return [
    { ignores: ['**/.svelte-kit/**', '**/build/**', '**/dist/**', '**/node_modules/**'] },
    ...svelte.configs.recommended,
    ...svelte.configs.prettier,
    {
      files: ['**/*.svelte'],
      languageOptions: {
        parserOptions: { parser: tsParser, svelteConfig }
      }
    },
    ...(theme ? [themeGuardrails] : [])
  ];
}

/** @type {import('eslint').Linter.Config} */
const themeGuardrails = {
  files: ['**/*.svelte'],
  plugins: {
    theme: { rules: { 'no-hardcoded-colors': noHardcodedColors } }
  },
  rules: {
    // Feature code must use the semantic tokens from packages/ui/src/global.css.
    'theme/no-hardcoded-colors': 'error',
    'no-restricted-syntax': [
      'error',
      ...['button', 'input', 'select', 'textarea', 'dialog'].map((name) => ({
        selector: `SvelteElement[name.name='${name}']`,
        message: `Use the ${name} primitive exported by @repo/ui instead of raw <${name}> markup.`
      }))
    ]
  }
};
