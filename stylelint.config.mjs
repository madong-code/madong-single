export default {
  extends: ['@vben/stylelint-config'],
  ignoreFiles: [
    '**/dist/**',
    '**/public/**',
    '**/__tests__/**',
    '**/coverage/**',
    '**/.{agent,agents,claude,codex}/**',
    'lib/**',
  ],
  root: true,
};
