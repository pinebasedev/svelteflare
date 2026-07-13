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
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'bits-ui',
              message: 'Import controls and reusable UI primitives from @repo/ui.'
            },
            {
              name: 'formsnap',
              message: 'Import the shared Form components from @repo/ui.'
            }
          ],
          patterns: [
            {
              group: ['@lucide/svelte', '@lucide/svelte/*', 'lucide-svelte', 'lucide-svelte/*'],
              message: 'Use ~icons/lucide/* for icons and @repo/ui for controls.'
            }
          ]
        }
      ],
      'no-restricted-syntax': [
        'error',
        ...['button', 'input', 'select', 'textarea', 'dialog'].map((name) => ({
          selector: `SvelteElement[name.name='${name}']`,
          message: `Use the ${name} primitive exported by @repo/ui instead of raw <${name}> markup.`
        }))
      ]
    }
  }
];
