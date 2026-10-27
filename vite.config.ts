import { fileURLToPath, URL } from 'node:url';

import ElementPlus from 'unplugin-element-plus/vite';

import { loadEnv } from 'vite';

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

export default defineConfig(async (config) => {
  // VITE_NITRO_MOCK=true 时接口代理到本地 Nitro mock（5320），否则代理到真实后端（8500）
  const env = loadEnv(config.mode ?? 'development', process.cwd());
  const useMock = (env.VITE_NITRO_MOCK ?? 'true') !== 'false';
  const apiProxy = useMock
    ? {
        // mock 服务路径自带 /adminapi 前缀，无需 rewrite
        '/adminapi': {
          changeOrigin: true,
          target: 'http://localhost:5320',
          ws: true,
          timeout: 0,
          proxyTimeout: 0,
        },
        // 支付插件用户端接口（如 mock 支付页 /api/pay/mock/paid，测试支付弹窗 iframe 内嵌使用）
        '/api': {
          changeOrigin: true,
          target: 'http://localhost:5320',
        },
        '/upload': {
          changeOrigin: true,
          target: 'http://localhost:5320',
        },
      }
    : {
        '/adminapi': {
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/adminapi/, ''),
          target: 'http://127.0.0.1:8500/adminapi',
          ws: true,
          // 无超时限制，支持大文件下载
          timeout: 0,
          proxyTimeout: 0,
        },
        // 后端 api 分组本身就是 /api 前缀，无需 rewrite
        '/api': {
          changeOrigin: true,
          target: 'http://127.0.0.1:8500',
        },
        '/upload': {
          changeOrigin: true,
          target: 'http://127.0.0.1:8500',
        },
      };

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
        {
          name: 'strip-sourcemap-url',
          enforce: 'post',
          transform(code, id) {
            if (
              id.endsWith('.js') ||
              id.endsWith('.cjs') ||
              id.endsWith('.css')
            ) {
              return code.replace(/\/\/# sourceMappingURL=\S+\s*$/gm, '');
            }
            return null;
          },
        },
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
        proxy: apiProxy,
        watch: {
          ignored: [
            '**/.dbg/**',
            '**/tooling/mock/.nitro/**',
            // 插件模板目录由后端在线安装/卸载动态增删（Windows 下 watcher 句柄
            // 会阻塞目录重命名/删除并留下 delete-pending 幽灵目录），排除监听；
            // 插件页面变更后手动刷新浏览器即可
            '**/src/plugin/**',
          ],
        },
      },
    },
  };
});
