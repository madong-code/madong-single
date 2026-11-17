<script setup lang="ts">
/** 授权版模块更新弹窗 (WP8)
 *  - 走 /tenant/plugin/{key}/update (SSE)
 *  - 显示进度条 + 实时日志
 *  - 区分 available/installed/upgradeable 三态
 */
import { onUnmounted, ref } from 'vue';

import {
  ElButton,
  ElIcon,
  ElMessage,
  ElProgress,
  ElTag,
} from 'element-plus';
import { CheckCircle2, CircleAlert, Loader2, RefreshCw } from 'lucide-vue-next';

import { TenantPluginService } from '#/api/app/plugin/tenant';
import { useDialog } from '#/components/dialog';
import { $t } from '#/locales';

import type { InstallStatus, TenantPluginInstallStatus } from '#/api/app/plugin/tenant/types';

defineOptions({ name: 'TenantModuleUpdateDialog' });

const props = defineProps<{ plugin: any }>();
const emit = defineEmits<{ close: []; refresh: [] }>();

const [Dialog, dialogApi] = useDialog({
  title: $t('app.plugin.market.update.dialog_title'),
  width: '600px',
  fullscreen: false,
  footer: false,
  draggable: true,
  closeOnClickModal: false,
  destroyOnClose: true,
});

// ── 进度 / 日志 ──
const status = ref<'idle' | 'pending' | 'success' | 'failed' | 'skipped'>('idle');
const percent = ref(0);
const logs = ref<{ msg: string; level: 'info' | 'error' }[]>([]);
const running = ref(false);
let sseSource: EventSource | null = null;

// ── 三态 ──
const installStatus = ref<InstallStatus>('unknown');
const statusInfo = ref<TenantPluginInstallStatus | null>(null);

const reset = () => {
  status.value = 'idle';
  percent.value = 0;
  logs.value = [];
  running.value = false;
  installStatus.value = 'unknown';
  statusInfo.value = null;
  sseSource?.close();
  sseSource = null;
};

const open = async () => {
  reset();
  dialogApi.open();
  start();
};

const start = async () => {
  if (!props.plugin) return;
  const key = props.plugin.code || props.plugin.key;
  if (!key) {
    ElMessage.error($t('app.plugin.market.install.invalid'));
    return;
  }

  status.value = 'pending';
  percent.value = 0;
  logs.value = [];
  running.value = true;

  // 先查三态
  try {
    const s: TenantPluginInstallStatus = await TenantPluginService.getInstallStatus(key);
    installStatus.value = s.status;
    statusInfo.value = s;
    if (s.status === 'available') {
      logs.value.push({ msg: $t('app.plugin.market.update.no_install'), level: 'error' });
      status.value = 'failed';
      running.value = false;
      return;
    }
    if (s.status === 'installed') {
      logs.value.push({ msg: $t('app.plugin.market.update.up_to_date'), level: 'info' });
      status.value = 'skipped';
      running.value = false;
      return;
    }
  } catch {
    logs.value.push({ msg: '[warn] 三态查询失败,继续执行', level: 'info' });
  }

  startSse(key);
};

const startSse = (key: string) => {
  const url = TenantPluginService.getUpdateUrl(key);
  sseSource = new EventSource(url);

  sseSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      handleSse(data);
    } catch {
      logs.value.push({ msg: e.data, level: 'info' });
    }
  };

  sseSource.onerror = () => {
    if (sseSource?.readyState === EventSource.CLOSED) return;
    status.value = 'failed';
    running.value = false;
    logs.value.push({ msg: $t('app.plugin.market.update.fail'), level: 'error' });
    sseSource?.close();
    sseSource = null;
  };
};

const handleSse = (data: any) => {
  if (!data || typeof data !== 'object') return;
  if (typeof data.pct === 'number') {
    percent.value = Math.max(0, Math.min(100, data.pct));
  }
  if (data.msg) {
    logs.value.push({ msg: data.msg, level: data.error ? 'error' : 'info' });
  }
  if (data.error) {
    status.value = 'failed';
    running.value = false;
    sseSource?.close();
    sseSource = null;
  }
  if (data.skipped) status.value = 'skipped';
  if (data.pct === 100 && status.value === 'pending') {
    status.value = 'success';
    running.value = false;
    sseSource?.close();
    sseSource = null;
    ElMessage.success(
      $t('app.plugin.market.update.success', { name: props.plugin?.name ?? 'unknown' }),
    );
  }
};

const close = () => {
  sseSource?.close();
  sseSource = null;
  running.value = false;
  dialogApi.close();
  emit('close');
};

const onRefresh = () => {
  emit('refresh');
  close();
};

const retry = () => {
  status.value = 'idle';
  start();
};

defineExpose({ open, close });

onUnmounted(() => {
  sseSource?.close();
  sseSource = null;
});
</script>

<template>
  <Dialog>
    <div v-if="plugin" class="update-dialog">
      <!-- 头部信息 -->
      <div class="header">
        <div class="plugin-meta">
          <div class="logo">
            <img v-if="plugin.icon || plugin.cover" :src="plugin.icon || plugin.cover" />
            <span v-else class="emoji">📦</span>
          </div>
          <div class="text">
            <div class="name">{{ plugin.name }}</div>
            <div class="code">{{ plugin.code || plugin.key }}</div>
          </div>
        </div>
        <ElTag
          v-if="installStatus !== 'unknown'"
          :type="
            installStatus === 'upgradeable'
              ? 'warning'
              : installStatus === 'installed'
                ? 'success'
                : 'info'
          "
          effect="plain"
        >
          {{
            installStatus === 'upgradeable'
              ? $t('app.plugin.market.status.upgradeable')
              : installStatus === 'installed'
                ? $t('app.plugin.market.status.installed')
                : $t('app.plugin.market.status.available')
          }}
        </ElTag>
      </div>

      <!-- 版本对比 -->
      <div v-if="statusInfo" class="version-row">
        <div class="version-cell">
          <div class="label">{{ $t('app.plugin.market.update.current_version') }}</div>
          <div class="value">{{ statusInfo.current_version || '—' }}</div>
        </div>
        <ElIcon><RefreshCw /></ElIcon>
        <div class="version-cell">
          <div class="label">{{ $t('app.plugin.market.update.platform_version') }}</div>
          <div class="value">{{ statusInfo.platform_version || '—' }}</div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-section">
        <ElProgress
          :percentage="percent"
          :status="
            status === 'success'
              ? 'success'
              : status === 'failed'
                ? 'exception'
                : ''
          "
          :stroke-width="14"
        />
        <div v-if="statusInfo?.sync_status" class="sync-state">
          {{
            $t('app.plugin.market.update.sync_status', { state: statusInfo.sync_status })
          }}
        </div>
      </div>

      <!-- 日志 -->
      <div class="log-box">
        <div class="log-title">{{ $t('app.plugin.market.update.log_title') }}</div>
        <div class="log-body">
          <div v-if="logs.length === 0" class="log-empty">
            {{ $t('app.plugin.market.update.log_empty') }}
          </div>
          <div
            v-for="(l, idx) in logs"
            :key="idx"
            class="log-line"
            :class="l.level"
          >
            <ElIcon v-if="l.level === 'error'" :size="12"><CircleAlert /></ElIcon>
            <ElIcon
              v-else-if="status === 'success' && idx === logs.length - 1"
              :size="12"
            ><CheckCircle2 /></ElIcon>
            <ElIcon v-else :size="12"><Loader2 /></ElIcon>
            <span>{{ l.msg }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton v-if="!running" @click="close">
          {{ $t('app.plugin.market.uninstall.cancel') }}
        </ElButton>
        <ElButton
          v-if="status === 'success' || status === 'skipped'"
          type="primary"
          @click="onRefresh"
        >
          {{ $t('app.plugin.market.standalone.install.refresh') }}
        </ElButton>
        <ElButton
          v-if="status === 'failed' && !running"
          type="warning"
          @click="retry"
        >
          {{ $t('app.plugin.market.standalone.install.retry') }}
        </ElButton>
        <ElButton
          v-if="!running && status === 'idle'"
          type="primary"
          @click="start"
        >
          {{ $t('app.plugin.market.update.start') }}
        </ElButton>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.update-dialog { display: flex; flex-direction: column; gap: 16px; }
.header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.plugin-meta { display: flex; gap: 12px; align-items: center; }
.logo {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--el-border-color); border-radius: 8px;
  background: var(--el-fill-color-light); overflow: hidden;
}
.logo img { width: 100%; height: 100%; object-fit: contain; }
.logo .emoji { font-size: 20px; }
.text .name { font-weight: 600; }
.text .code { font-family: monospace; font-size: 12px; color: var(--el-text-color-secondary); }
.version-row {
  display: flex; align-items: center; gap: 16px; justify-content: center;
  padding: 12px; background: var(--el-fill-color-light); border-radius: 8px;
}
.version-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.version-cell .label { font-size: 12px; color: var(--el-text-color-secondary); }
.version-cell .value { font-family: monospace; font-size: 16px; font-weight: 600; }
.progress-section { padding: 4px 0; }
.sync-state { margin-top: 6px; font-size: 12px; color: var(--el-text-color-secondary); }
.log-box { border: 1px solid var(--el-border-color); border-radius: 6px; overflow: hidden; }
.log-title {
  padding: 8px 12px; background: var(--el-fill-color-light);
  font-size: 12px; font-weight: 600; border-bottom: 1px solid var(--el-border-color);
}
.log-body {
  padding: 8px 12px; max-height: 200px; overflow-y: auto;
  font-family: monospace; font-size: 12px; line-height: 1.7;
}
.log-line { display: flex; gap: 6px; align-items: center; }
.log-line.error { color: var(--el-color-danger); }
.log-empty { color: var(--el-text-color-placeholder); font-style: italic; }
.dialog-footer { display: flex; gap: 8px; justify-content: flex-end; }
</style>
