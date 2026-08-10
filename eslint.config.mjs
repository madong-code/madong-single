import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    ignores: ['lib/**', 'src/utils/push/push-vue.js'],
  },
  {
    files: [
      'src/components/crud/components/viewer/**/*.vue',
      'src/components/form/components/**/*.vue',
    ],
    rules: {
      'vue/require-default-prop': 'off',
    },
  },
  {
    rules: {
      'unicorn/no-nested-ternary': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
  },
]);
