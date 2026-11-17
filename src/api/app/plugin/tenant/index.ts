/** 租户插件模块 - API service (WP8)
 *  - 三态查询
 *  - update / install / uninstall 走 SSE(由 caller 直接 new EventSource)
 */
import { requestClient } from '#/api/request';

import type { TenantPluginInstallStatus } from './types';

const baseUrl = '/tenant/plugin';

export const TenantPluginService = {
  /** 三态查询 */
  getInstallStatus(key: string): Promise<TenantPluginInstallStatus> {
    return requestClient.get(`${baseUrl}/${key}/status`);
  },

  /** 启动更新 (SSE, 不通过 fetch, 由组件 new EventSource) */
  getUpdateUrl(key: string, version?: string): string {
    const v = version ? `?version=${encodeURIComponent(version)}` : '';
    return `${baseUrl}/${encodeURIComponent(key)}/update${v}`;
  },

  /** 启动安装 (SSE) */
  getInstallUrl(key: string): string {
    return `${baseUrl}/${encodeURIComponent(key)}/install`;
  },

  /** 启动卸载 (SSE) */
  getUninstallUrl(key: string): string {
    return `${baseUrl}/${encodeURIComponent(key)}/uninstall`;
  },
};
