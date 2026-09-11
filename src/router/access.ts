import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '#/core/shared/types';

import { defineComponent, h } from 'vue';
import { RouterView } from 'vue-router';

import { ElMessage } from 'element-plus';

import { getAllMenusApi } from '#/api';
import { generateAccessible } from '#/core/access';
import { preferences } from '#/core/preferences';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

import pluginRouter from './plugin';

/**
 * RouteView：路由分组容器，仅渲染子路由的 router-view。
 *
 * 必须使用静态函数式包装，不能用 `() => import('vue-router').then(m => m.RouterView)` 异步包装：
 * 异步包装解析后 KeepAlive 会直接缓存 RouterView（vue-router 弃用用法），
 * 导致 SPA 切换路由时嵌套视图不渲染（页面空白）甚至渲染进程挂起。
 */
const RouteView = defineComponent({
  name: 'RouteView',
  setup() {
    return () => h(RouterView);
  },
});

/** 无权限时显示的 403 组件 */
const FORBIDDEN_COMPONENT = () =>
  import('#/views/_core/fallback/forbidden.vue');

/**
 * 打印扫描到的组件模板
 */
function logScannedTemplates(pageMap: ComponentRecordType): void {
  if (!import.meta.env.DEV) return;

  const keys = Object.keys(pageMap);
  console.warn(`[generateAccess] 📦 Scanned ${keys.length} components:`);

  // 按目录分类统计
  const categorized: Record<string, string[]> = {};
  keys.forEach((key) => {
    const parts = key.replace('../', '').split('/');
    const category = parts[0] || 'unknown';
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(key);
  });

  Object.entries(categorized).forEach(([category, items]) => {
    console.warn(`[generateAccess] 📂 ${category}: ${items.length} files`);
  });
}

/**
 * 扫描并构建页面组件映射表
 */
function buildPageMap(): ComponentRecordType {
  const viewsMap = import.meta.glob('../views/**/*.vue', { eager: false });
  const pluginsMap = import.meta.glob('../plugin/**/*.vue', { eager: false });

  const pageMap: ComponentRecordType = {
    ...(viewsMap as ComponentRecordType),
    ...(pluginsMap as ComponentRecordType),
  };

  logScannedTemplates(pageMap);

  return pageMap;
}

/**
 * 从后端获取菜单列表
 */
async function fetchBackendMenus(): Promise<any[]> {
  ElMessage({
    duration: 1500,
    message: `${$t('common.loadingMenu')}...`,
  });

  const backendMenus = await getAllMenusApi();

  // 后端菜单去重（按 name 和 path 去重）
  const dedup = (menus: any[]): any[] => {
    const seen = new Set<string>();
    return menus.filter((m) => {
      const key = `${m.name || ''}_${m.path || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (m.children) m.children = dedup(m.children);
      return true;
    });
  };

  // 合并插件定义的后端格式路由
  return pluginRouter.mergeBackendMenus(dedup(backendMenus));
}

/**
 * 生成路由和菜单（核心方法）
 */
async function generateAccess(
  options: GenerateMenuAndRoutesOptions,
): Promise<any> {
  const pageMap = buildPageMap();

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: fetchBackendMenus,
    forbiddenComponent: FORBIDDEN_COMPONENT,
    layoutMap: { BasicLayout, IFrameView, RouteView },
    pageMap,
  });
}

export { fetchBackendMenus, generateAccess };
