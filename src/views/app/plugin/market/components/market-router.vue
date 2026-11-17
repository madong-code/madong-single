<script setup lang="ts">
/** 模块市场路由：根据运行模式(SaaS多租户/单机版)显示对应分支
 *  - SaaS 模式：显示"租户插件管理"(平台已装插件, 安装/卸载/更新菜单)
 *  - 单体模式：显示完整单体版模块市场
 */
import { computed, onMounted, ref } from 'vue';

import { requestClient } from '#/api/request';

import TenantModuleMarket from './tenant/tenant-module-market.vue';
import StandaloneModuleMarket from './standalone/standalone-module-market.vue';

defineOptions({ name: 'MarketRouter' });

const mode = ref<string>('standalone');
const loading = ref(true);

onMounted(async () => {
  try {
    const res: any = await requestClient.get('/site/mode');
    mode.value = res?.mode || 'standalone';
  } catch {
    mode.value = 'standalone';
  } finally {
    loading.value = false;
  }
});

const isSaasMode = computed(() => mode.value === 'saas');
</script>

<template>
  <div v-loading="loading" class="h-full flex flex-col">
    <TenantModuleMarket v-if="isSaasMode" class="flex-1" />
    <StandaloneModuleMarket v-else-if="!loading" class="flex-1" />
  </div>
</template>
