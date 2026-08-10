<script lang="ts" setup>
import { watch } from 'vue';

import { ElConfigProvider } from 'element-plus';

import { useElementPlusDesignTokens } from '#/core/composables';
import { elementLocale } from '#/locales';
import { useSiteConfigStore } from '#/store/modules/site-config';

defineOptions({ name: 'App' });

useElementPlusDesignTokens();

const siteConfigStore = useSiteConfigStore();

// 监听站点配置变化，动态更新 title 和 favicon
watch(
  () => siteConfigStore.getCurrentConfig(),
  (config) => {
    if (config.title) {
      document.title = config.title;
    }
    if (config.favicon) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) {
        link.href = config.favicon;
      }
    }
  },
  { immediate: true },
);
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />
  </ElConfigProvider>
</template>
