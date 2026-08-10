<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { AuthPageLayout } from '#/core/layouts';
import { preferences } from '#/core/preferences';
import { $t } from '#/locales';
import { useSiteConfigStore } from '#/store/modules/site-config';

const siteConfigStore = useSiteConfigStore();

const appName = computed(
  () => siteConfigStore.platformConfig.title || preferences.app.name,
);
const logo = computed(
  () => siteConfigStore.platformConfig.logo || preferences.logo.source,
);
const logoDark = computed(
  () => siteConfigStore.platformConfig.logo || preferences.logo.sourceDark,
);

// 登录页加载时确保站点配置就绪（退出登录后需要重新拉取品牌信息）
// fetchSiteConfig 内部已做「已加载则跳过」判断，重复调用安全
onMounted(() => {
  siteConfigStore.fetchSiteConfig();
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
