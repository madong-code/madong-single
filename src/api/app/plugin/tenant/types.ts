/** 租户插件模块 - 通用类型 (WP8) */

export type InstallStatus = 'available' | 'installed' | 'upgradeable' | 'unknown';

export interface TenantPluginInstallStatus {
  status: InstallStatus;
  plugin_key: string;
  tenant_id: string;
  current_version: string | null;
  platform_version: string | null;
  sync_status: string | null;
  isolation_mode: string | null;
}

/** update SSE 帧 */
export interface TenantPluginUpdateSseFrame {
  msg?: string;
  pct?: number;
  error?: boolean;
  skipped?: boolean;
  plugin?: string;
  tenant_id?: string;
  hint?: string;
  from?: string;
  version?: string;
}
