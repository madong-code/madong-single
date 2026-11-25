<script lang="ts" setup>
import { watch } from 'vue';

import { ElConfigProvider } from 'element-plus';

import { useElementPlusDesignTokens } from '#/core/composables';
import { preferences } from '#/core/preferences';
import { elementLocale } from '#/locales';
import { useSiteConfigStore } from '#/store/modules/site-config';

defineOptions({ name: 'App' });

useElementPlusDesignTokens();

const siteConfigStore = useSiteConfigStore();

// 监听站点配置变化，动态更新浏览器标题。
// 空配置时回退到已同步 env 默认值的 preferences，避免残留上一租户的 DOM 值。
// favicon 统一由 site-config store 写入（动态 favicon → 动态 Logo → env 默认），
// 此处不再重置，避免把 store 解析出的动态图标覆盖回静态文件。
watch(
  () => siteConfigStore.getCurrentConfig(),
  (config) => {
    document.title = config.title || preferences.app.name;
  },
  { immediate: true },
);
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />
  </ElConfigProvider>
</template>
