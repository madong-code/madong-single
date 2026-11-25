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

  // 注册Element Plus提供的v-loading指令
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

  const { useSiteConfigStore } = await import('#/store/modules/site-config');
  const siteConfigStore = useSiteConfigStore();

  if (accessStore.accessToken) {
    // 已登录：以租户配置为准，同时后台校准平台配置。
    // store 初始化已从 __site_config__ 恢复平台品牌，刷新后不会先把动态 Logo/favicon
    // 回退成前端静态资源；平台请求只用于补齐存储运行时字段，非阻塞。
    siteConfigStore.fetchPlatformConfig();
    // 非阻塞同步租户品牌，解决刷新页面后左侧 Logo/标题被 preferences 默认值覆盖的问题
    siteConfigStore.syncTenantPreferences();
  } else {
    // 未登录：预加载平台站点配置（阻塞，确保登录页品牌信息就绪）
    await siteConfigStore.fetchPlatformConfig();
  }

  // loading 动画的标题/Logo/主色由 loading.html 的内联脚本在渲染前从 localStorage 读取处理
  // bootstrap.ts 不再事后修改 loading 动画 DOM，避免"硬编码 → 动态切换"的闪动

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
