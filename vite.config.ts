import { fileURLToPath, URL } from 'node:url';

import ElementPlus from 'unplugin-element-plus/vite';

import { defineConfig } from './build/vite';
import { viteVisualFormElementPlusPlugin } from './build/vite/plugins/visual-form';

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
const VISUAL_FORM_UMD_PATH = fileURLToPath(
  new URL('lib/visual-form/designer.umd.js', import.meta.url),
);

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        viteVisualFormElementPlusPlugin({
          umdPath: VISUAL_FORM_UMD_PATH,
        }),
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
          '#lib': fileURLToPath(new URL('lib', import.meta.url)),
        },
      },
      server: {
        proxy: {
          '/adminapi': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/adminapi/, ''),
            target: 'http://127.0.0.1:8500/adminapi',
            ws: true,
          },
          '/upload': {
            changeOrigin: true,
            target: 'http://127.0.0.1:8500',
          },
        },
        watch: {
          ignored: ['**/.dbg/**', '**/tooling/mock/.nitro/**'],
        },
      },
    },
  };
});
