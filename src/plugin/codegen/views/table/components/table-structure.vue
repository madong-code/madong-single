<script setup lang="ts">
import { ref } from 'vue';

import {
  ElDrawer,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTabPane,
} from 'element-plus';

import { $t } from '#/locales';

import { GeneratorTableService } from '#/api/app/plugin/codegen/table';

interface StructColumn {
  field: string;
  type: string;
  collation: string;
  null: string;
  key: string;
  default: string | null;
  extra: string;
  comment: string;
}

interface StructData {
  name: string;
  create_sql: string;
  columns: StructColumn[];
  column_count: number;
}

const visible = ref(false);
const data = ref<StructData | null>(null);
const loading = ref(false);
const activeTab = ref('columns');

async function load(name: string) {
  if (!name) return;
  loading.value = true;
  data.value = null;
  try {
    const res = await GeneratorTableService.getStructure(name);
    data.value = res;
  } catch (e: any) {
    ElMessage.error(e?.message || $t('common.error'));
  } finally {
    loading.value = false;
  }
}

function show(name: string) {
  data.value = null;
  activeTab.value = 'columns';
  visible.value = true;
  load(name);
}

defineExpose({ show });
</script>

<template>
  <ElDrawer
    v-model="visible"
    :title="`${$t('codegen.table.table.structure_title')}${data?.name ? ` - ${data.name}` : ''}`"
    size="72%"
    direction="rtl"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="m-drawer-body">
      <div v-if="data" class="mb-3 flex items-center gap-3 text-[13px]">
        <ElTabs v-model="activeTab">
          <ElTabPane
            :label="`${$t('codegen.table.table.structure.field')}（${data.column_count}）`"
            name="columns"
          />
          <ElTabPane
            :label="$t('codegen.table.table.structure.create_sql')"
            name="sql"
          />
        </ElTabs>
      </div>

      <template v-if="data">
        <ElTable v-if="activeTab === 'columns'" :data="data.columns ?? []" border>
          <ElTableColumn type="index" width="50" />
          <ElTableColumn prop="field" :label="$t('codegen.table.table.structure.field')" />
          <ElTableColumn prop="type" :label="$t('codegen.table.table.structure.type')" />
          <ElTableColumn prop="collation" :label="$t('codegen.table.table.structure.collation')" />
          <ElTableColumn prop="null" :label="$t('codegen.table.table.structure.nullable')" width="80" align="center" />
          <ElTableColumn prop="key" :label="$t('codegen.table.table.structure.key')" width="80" align="center" />
          <ElTableColumn prop="default" :label="$t('codegen.table.table.structure.default')" />
          <ElTableColumn prop="extra" :label="$t('codegen.table.table.structure.extra')" />
          <ElTableColumn prop="comment" :label="$t('codegen.table.table.structure.comment')" />
        </ElTable>
        <pre v-else class="m-structure-sql">{{ data.create_sql || '--' }}</pre>
      </template>
    </div>
  </ElDrawer>
</template>

<style scoped>
.m-drawer-body {
  height: 100%;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.m-structure-sql {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background-color: #f5f7fa;
  color: #303133;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}
</style>
