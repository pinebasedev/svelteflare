export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'ci', 'build', 'perf']
    ],
    'scope-enum': [
      2,
      'always',
      ['api', 'web', 'marketing', 'ui', 'alchemy', 'ci', 'db', 'tooling', 'docs']
    ],
    'scope-empty': [2, 'never']
  }
};
