<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { AuthPageLayout } from '#/core/layouts';
import { preferences } from '#/core/preferences';

import { $t } from '#/locales';
import { useSiteConfigStore } from '#/store/modules/site-config';
import { buildStaticUrl } from '#/utils/url';

const siteConfigStore = useSiteConfigStore();

const appName = computed(
  () => siteConfigStore.platformConfig.title || preferences.app.name,
);

/**
 * 登录页尚未进入租户上下文，拿到的是平台配置（/auth/site-info）。
 * 其 logo 是存储 key（如 /storage/xxx），必须用「提供该 logo 的平台配置」
 * 自身的 static_url / is_private / storage_prefix 解析，否则会被浏览器
 * 当成站点同域资源请求（Vite 返回 index.html），导致 Logo 显示异常。
 */
function resolvePlatformLogo(): string {
  const config = siteConfigStore.platformConfig;
  return buildStaticUrl(
    config.logo || '',
    config.static_url,
    true,
    config,
  );
}

const logo = computed(
  () => resolvePlatformLogo() || preferences.logo.source,
);
const logoDark = computed(
  () => resolvePlatformLogo() || preferences.logo.sourceDark,
);

// 登录页加载时，如果平台配置为空则自动获取（保障退出登录后有平台品牌信息可展示）
onMounted(() => {
  if (!siteConfigStore.platformIsLoaded) {
    siteConfigStore.fetchPlatformConfig();
  }
});
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :logo-dark="logoDark"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
