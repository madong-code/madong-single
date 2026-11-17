<script setup lang="ts">
/** 租户插件管理 - 内部租户插件列表(原"授权版模块市场"迁出) */
import { onMounted, ref } from 'vue';

import { requestClient } from '#/api/request';

import TenantModuleDetail from './module-detail.vue';
import TenantModuleList from './module-list.vue';
import TenantModuleTableHeader from './table-header.vue';

defineOptions({ name: 'TenantModuleMarket' });

// ── 状态管理 ────────────────────────────
const searchKeyword = ref('');
const activeTab = ref('all');
const currentViewMode = ref<'card' | 'table'>('card');
const loading = ref(false);
/** 全量数据（一次拉取） */
const allModules = ref<any[]>([]);
/** 当前 Tab 过滤后的数据 */
const modulesData = ref<any[]>([]);
const totalCount = ref(0);

// 模块详情
const moduleDetailRef = ref();
void moduleDetailRef;
const selectedModuleForDetail = ref<any>(null);

// ── API 请求（租户已授权插件列表）────────
const buildApiParams = () => {
  const params: Record<string, any> = { page: 1, limit: 100 };
  if (searchKeyword.value) params.keyword = searchKeyword.value;
  return params;
};

// 分类过滤 (后端仅返回平台已装插件, 分类在前端过滤)
const filterByTab = (items: any[], tab: string) => {
  switch (tab) {
    case 'installed':
      return items.filter((m) => m.is_installed === 1);
    case 'un_installed':
      return items.filter((m) => m.is_installed === 0);
    case 'purchased':
      // 已授权：对接平台授权列表（auth_status=authorized 或已安装）
      return items.filter((m) => m.is_authorized === 1);
    case 'updatable':
      return items.filter((m) => m.has_update === true);
    default:
      return items;
  }
};

/** 本地过滤：切 Tab 不请求、无 loading 遮罩，体验与「我的应用」一致 */
const applyFilter = () => {
  modulesData.value = filterByTab(allModules.value, activeTab.value);
  totalCount.value = modulesData.value.length;
};

const fetchModules = async () => {
  loading.value = true;
  try {
    const params = buildApiParams();
    // 后端 getAvailablePlugins 返回纯数组 (data 字段)
    const response: any = await requestClient.get('/tenant/plugin', { params });
    const raw = Array.isArray(response) ? response : (response?.items ?? []);
    allModules.value = raw;
    applyFilter();
  } finally {
    loading.value = false;
  }
};

// ── 事件处理（无删除）────────────────────
const handleSearch = async (keyword: string) => {
  searchKeyword.value = keyword;
  await fetchModules();
};

/** 切 Tab 走本地过滤，不发请求 → 无白屏闪烁 */
const handleTabChange = (tab: string) => {
  activeTab.value = tab;
  applyFilter();
};

const handleViewChange = (mode: 'card' | 'table') => {
  currentViewMode.value = mode;
};

const handleRefresh = async () => {
  await fetchModules();
};

// 安装菜单：由子弹窗内部处理 POST /tenant/plugin/{code}/install-menu
const handleInstall = async () => {
  await fetchModules();
};

// 卸载菜单：由子弹窗内部处理 POST /tenant/plugin/{code}/uninstall-menu
const handleUninstall = async () => {
  await fetchModules();
};

// 更新数据库：由子组件处理 POST /tenant/plugin/{code}/update-db
const handleUpdateDb = async () => {
  await fetchModules();
};

// 首次进入主动拉一次全量（骨架屏占位，不用 v-loading 白色遮罩）
onMounted(fetchModules);
</script>

<template>
  <div class="module-container flex flex-col min-h-0">
    <TenantModuleTableHeader
      :total-count="totalCount"
      :loading="loading"
      @search="handleSearch"
      @tab-change="handleTabChange"
      @view-change="handleViewChange"
      @refresh="handleRefresh"
    />
    <TenantModuleList
      class="flex-1 min-h-0"
      :modules="modulesData"
      :view-mode="currentViewMode"
      :loading="loading"
      @install="handleInstall"
      @uninstall="handleUninstall"
      @update="handleUpdateDb"
    />

    <TenantModuleDetail
      ref="moduleDetailRef"
      :module-id="selectedModuleForDetail?.id"
      @close="selectedModuleForDetail = null"
      @install="handleInstall"
      @uninstall="handleUninstall"
      @update="handleUpdateDb"
      @refresh="handleRefresh"
    />
  </div>
</template>
