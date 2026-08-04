<script lang="ts" setup>
import { ElConfigProvider } from 'element-plus';

import { useElementPlusDesignTokens } from '#/core/composables';
import { elementLocale } from '#/locales';

defineOptions({ name: 'App' });

useElementPlusDesignTokens();
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />
  </ElConfigProvider>
</template>
