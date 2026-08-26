import { createApp, watchEffect } from 'vue';

import { useTitle } from '@vueuse/core';
import { ElLoading } from 'element-plus';

import { registerAccessDirective } from '#/core/access';
import { preferences } from '#/core/preferences';
import { initStores, useAccessStore, useTimezoneStore } from '#/core/stores';
import { registerLoadingDirective } from '#/core/ui/common';
import { $t, setupI18n } from '#/locales';

import { initComponentAdapter } from './adapter/component';
import { initSetupVbenForm } from './adapter/form';
import App from './app.vue';
import { router } from './router';

import '#/core/design/styles';

import '#/core/design/styles/ele/index.css';

(async () => {
  // 加载离线图标
  if ((import.meta as any).env.VITE_APP_ICON_OFFLINE === 'true') {
    await import('#/components/icon/load-offline');
  }
})();

async function bootstrap(namespace: string) {
  // 初始化组件适配器
  await initComponentAdapter();

  // 初始化表单组件
  await initSetupVbenForm();

  const app = createApp(App);

  // 注册 Element Plus 提供的 v-loading 指令。
  app.directive('loading', ElLoading.directive);

  // 注册Vben提供的v-loading和v-spinning指令
  registerLoadingDirective(app, {
    loading: false, // Vben提供的v-loading指令和Element Plus提供的v-loading指令二选一即可，此处false表示不注册Vben提供的v-loading指令
    spinning: 'spinning',
  });

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-tore
  await initStores(app, { namespace });

  // 初始化时区（设置 dayjs 默认时区）
  useTimezoneStore();

  // 配置超级权限码，拥有这些权限码的用户拥有所有权限
  // 默认为 ['*']，可在此处自定义，例如 ['*', 'admin']
  const accessStore = useAccessStore();
  accessStore.setSuperCodes(['*', 'admin']);

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化 tippy
  const { initTippy } = await import('#/core/ui/common/components/tippy');
  initTippy(app);

  // 配置路由及路由守卫
  app.use(router);

  // 配置Motion插件
  const { MotionPlugin } = await import('#/core/plugins/motion');
  app.use(MotionPlugin);

  // 初始化 Visual Form 插件（VForm3 可视化表单设计器）
  // 在应用启动时预加载，避免组件首次使用时的异步加载延迟
  try {
    const { installVisualForm } = await import('#/core/plugins/visual-form');
    await installVisualForm(app);
  } catch (e) {
    console.warn('[VisualForm] 预加载失败，将在组件使用时重试:', e);
  }

  // 预加载站点配置（阻塞，确保登录页品牌信息就绪）
  // 登录前/登录后同源：GET /system/config/code/site_setting
  const { useSiteConfigStore } = await import('#/store/modules/site-config');
  const siteConfigStore = useSiteConfigStore();
  await siteConfigStore.fetchSiteConfig();

  // loading 动画的标题/Logo/主色由 loading.html 的内联脚本在渲染前从 localStorage 读取处理
  // bootstrap.ts 不再事后修改 loading 动画 DOM，避免"硬编码 → 动态切换"的闪动

  // 把站点配置同步到 preferences，覆盖 .env 写入的默认 app.name/logo.source。
  // 配置上面已无条件拉取（含登录前），无论是否登录都需同步。
  // 必须 await：applyToPreferences 内部有动态 import(#/core/preferences)，
  // 若不等待，app.mount 会先于 setPreferences 执行，导致首屏渲染仍是 env 默认值。
  // 响应式系统虽最终会追平，但为消除首屏闪烁与竞态，这里阻塞到同步完成。
  await siteConfigStore.applyToPreferences();

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
