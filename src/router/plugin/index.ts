/**
 * 插件路由管理模块
 * 完全兼容旧API，使用方式不变
 */
import type { RouteRecordRaw } from 'vue-router';

import { pluginRouteScanner } from './scanner';

/**
 * 统一插件路由管理器（对外API和之前完全一致，兼容所有旧代码）
 */
const pluginRouter = {
  /**
   * 获取扫描到的纯前端路由（RouteRecordRaw 格式）
   * @param forceRescan 是否强制重新扫描
   * @returns RouteRecordRaw[]
   */
  getFrontendRoutes(forceRescan: boolean = false): RouteRecordRaw[] {
    return pluginRouteScanner.getFrontendRoutes(forceRescan);
  },

  /**
   * 扫描并合并插件路由到后端菜单
   * @param backendMenus 后端返回的菜单数组
   * @param forceRescan 是否强制重新扫描
   * @returns 合并后的菜单数组
   */
  mergeBackendMenus(backendMenus: any[], forceRescan: boolean = false): any[] {
    return pluginRouteScanner.mergeBackendMenus(backendMenus, forceRescan);
  },

  /**
   * 获取扫描状态
   */
  getStatus() {
    return pluginRouteScanner.getStatus();
  },

  /**
   * 清除所有扫描缓存
   */
  clearAllCache(): void {
    pluginRouteScanner.clearCache();
  },

  /**
   * 扫描所有路由（前端 + 后端）
   */
  scanAll(): { backend: any[]; frontend: RouteRecordRaw[] } {
    const { frontendRoutes, backendRoutes } = pluginRouteScanner.scan();
    return {
      frontend: frontendRoutes,
      backend: backendRoutes,
    };
  },
};

export default pluginRouter;

// 兼容导出旧的扫描器类和实例（如果有地方直接导入了）
export { PluginRouteScanner, pluginRouteScanner } from './scanner';
// 兼容旧的导出名称
export const FrontendRouteScanner = () => {
  throw new Error('FrontendRouteScanner已废弃，请使用统一的pluginRouter');
};
export const BackendRouteScanner = () => {
  throw new Error('BackendRouteScanner已废弃，请使用统一的pluginRouter');
};
export const frontendRouteScanner = pluginRouteScanner;
export const backendRouteScanner = pluginRouteScanner;
