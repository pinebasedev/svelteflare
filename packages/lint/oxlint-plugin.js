import noHardcodedColors from './rules/no-hardcoded-colors.js';

/**
 * oxlint JS plugin, enabled in the root .oxlintrc.json for .ts/.js files.
 * .svelte files get the same rule through ESLint (./eslint.js), which also
 * sees their markup.
 */
export default {
  meta: { name: 'theme' },
  rules: { 'no-hardcoded-colors': noHardcodedColors }
};
