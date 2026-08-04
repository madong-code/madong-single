import type { Linter } from 'eslint';

const restrictedImportIgnores = ['**/vite.config.mts'];

const applicationLayerImportPattern = {
  group: [
    '#/api',
    '#/api/*',
    '#/components',
    '#/components/*',
    '#/router',
    '#/router/*',
    '#/views',
    '#/views/*',
  ],
  message: 'src/core cannot import application-layer modules.',
};

const runtimeNamespaceImportPattern = {
  group: ['@/*', '@vben/*', '@vben-core/*'],
  message: 'Runtime source imports must use the local #/ namespace.',
};

const coreBaseImportPatterns = [
  applicationLayerImportPattern,
  runtimeNamespaceImportPattern,
];

const customConfig: Linter.Config[] = [
  // shadcn-ui 内部组件是自动生成的，不做太多限制
  {
    files: ['src/core/ui/primitives/**/*'],
    rules: {
      'vue/require-default-prop': 'off',
    },
  },
  {
    files: ['src/**/*'],
    ignores: restrictedImportIgnores,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [runtimeNamespaceImportPattern],
        },
      ],
      'perfectionist/sort-interfaces': 'off',
    },
  },
  {
    // Core 只能依赖自身和第三方模块，不能反向依赖应用层。
    files: ['src/core/**/*'],
    ignores: restrictedImportIgnores,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: coreBaseImportPatterns,
        },
      ],
    },
  },
  {
    files: ['tooling/mock/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/**/playwright.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['build/**/*'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/core/shared/utils/inference.ts'],
    rules: {
      'vue/prefer-import-from-vue': 'off',
    },
  },
  {
    files: ['src/core/ui/menu/sub-menu.vue'],
    rules: {
      'import/no-self-import': 'off',
    },
  },
];

export { customConfig };
