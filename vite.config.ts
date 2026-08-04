import { fileURLToPath, URL } from 'node:url';

import ElementPlus from 'unplugin-element-plus/vite';

import { defineConfig } from './build/vite';

const MOCK_SERVER_PORT = 5321;
const ELEMENT_PLUS_STYLE_DEPS = [
  'button',
  'card',
  'checkbox',
  'checkbox-button',
  'checkbox-group',
  'config-provider',
  'date-picker',
  'divider',
  'image',
  'input',
  'input-number',
  'loading',
  'message',
  'notification',
  'radio',
  'radio-button',
  'radio-group',
  'segmented',
  'select-v2',
  'space',
  'switch',
  'table',
  'time-picker',
  'tree-select',
  'upload',
].map((component) => `element-plus/es/components/${component}/style/css`);

export default defineConfig(async () => {
  // #region debug-point D:optimize-deps-config
  await fetch('http://127.0.0.1:7777/event', {
    body: JSON.stringify({
      data: { optimizeDepsInclude: ELEMENT_PLUS_STYLE_DEPS },
      hypothesisId: 'D',
      location: 'vite.config.ts',
      msg: '[DEBUG] Element Plus style dependencies configured for pre-bundling',
      runId: 'post-fix',
      sessionId: 'browser-console-error',
      ts: Date.now(),
    }),
    method: 'POST',
  }).catch(() => {});
  // #endregion

  return {
    application: {
      nitroMockOptions: {
        port: MOCK_SERVER_PORT,
      },
    },
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      optimizeDeps: {
        include: ELEMENT_PLUS_STYLE_DEPS,
      },
      resolve: {
        alias: {
          '#': fileURLToPath(new URL('src', import.meta.url)),
        },
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            target: `http://localhost:${MOCK_SERVER_PORT}`,
            ws: true,
          },
        },
        watch: {
          ignored: ['**/tooling/mock/.nitro/**'],
        },
      },
    },
  };
});
