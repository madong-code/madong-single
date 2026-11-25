<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '#/components/page';

/** 模块市场页面入口 */
import { MarketRouter } from './components';

defineOptions({ name: 'AppPluginMarket' });

const viewMode = ref<'card' | 'table'>('card');
</script>

<template>
  <Page :auto-content-height="viewMode === 'table'">
    <MarketRouter @view-mode-change="viewMode = $event" />
  </Page>
</template>
