import type { RouteRecordRaw } from 'vue-router';

import { preferences } from '#/core/preferences';

/**
 * 统一插件路由扫描器
 * 一次性扫描所有插件路由，分别缓存前端和后端格式路由
 * 实现：自动模块识别、错误隔离、路径校验
 */
export class PluginRouteScanner {
  private cachedBackendRoutes: any[] = [];
  private cachedFrontendRoutes: RouteRecordRaw[] = [];
  private hasScanned: boolean = false;
  private readonly isDev: boolean = import.meta.env.DEV;
  // 全局页面映射表，用于校验组件路径是否存在
  private pageMap: null | Record<string, () => Promise<any>> = null;

  constructor() {
    // 预加载页面映射表，用于路径校验
    if (this.isDev) {
      this.pageMap = import.meta.glob('../../plugin/**/*.vue', {
        eager: false,
      });
    }
  }

  /**
   * 是否启用插件静态路由（来自插件 routes/index.ts 的前/后端格式路由）
   * 仅在「前端模式」或「开发环境」下启用：
   *  - frontend 模式：前端静态路由是权威来源，必须扫描
   *  - 开发环境：便于本地开发调试插件，且不会与后端部署冲突
   *  - backend/mixed 模式 + 生产：由后端返回的菜单作为权威来源，
   *    若再静态合并插件路由会与后端返回的同名路由冲突，故跳过
   */
  private isPluginStaticEnabled(): boolean {
    if (this.isDev) return true;
    return preferences.app.accessMode === 'frontend';
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedFrontendRoutes = [];
    this.cachedBackendRoutes = [];
    this.hasScanned = false;
  }

  /**
   * 获取前端路由
   */
  getFrontendRoutes(forceRescan = false): RouteRecordRaw[] {
    if (forceRescan) {
      this.clearCache();
    }
    return this.scan().frontendRoutes;
  }

  /**
   * 获取扫描状态
   */
  getStatus() {
    return {
      hasScanned: this.hasScanned,
      frontendCount: this.cachedFrontendRoutes.length,
      backendCount: this.cachedBackendRoutes.length,
    };
  }

  /**
   * 合并插件路由到后端菜单
   *
   * 合并语义（与 aura 模版保持一致）：
   * - 后端菜单为权威基底：name（取自权限码，是路由身份锚点）与 meta 展示字段
   *   （title/icon/order）保留后端值，插件仅在缺失字段上补充（如 meta.module）
   * - 同节点识别：name 大小写不敏感（后端 'codegen' vs 插件 'Codegen'），
   *   或 path 相同（后端 name 常为权限码，插件 routes 常用自定义 name）
   * - 插件独有节点追加到末尾（sort 9999）
   */
  mergeBackendMenus(backendMenus: any[], forceRescan = false): any[] {
    if (forceRescan) {
      this.clearCache();
    }

    const { backendRoutes } = this.scan();
    if (backendRoutes.length === 0) {
      return backendMenus;
    }

    const normalizePath = (p?: string): string => (p || '').replace(/\/+$/, '');
    const lowerName = (v: any): string => String(v ?? '').toLowerCase();

    /** 查找同节点：name 大小写不敏感，或 path 相同 */
    const findMatch = (
      list: any[],
      extra: any,
    ): any | undefined =>
      list.find((item) => lowerName(item.name) === lowerName(extra.name)) ??
      (normalizePath(extra.path)
        ? list.find(
            (item) => normalizePath(item.path) === normalizePath(extra.path),
          )
        : undefined);

    /** 合并节点：后端为基底，插件补充缺失字段（name 永远保留后端值） */
    const mergeNode = (existing: any, extra: any): void => {
      const { children: extraChildren, meta: extraMeta, ...rest } = extra;
      // name 保留后端值，避免插件自定义 name 覆盖权限码锚点
      const { name: _ignored, ...overridable } = rest;
      Object.assign(existing, overridable);
      if (extraMeta) {
        existing.meta = { ...extraMeta, ...(existing.meta ?? {}) };
      }
      if (extraChildren?.length) {
        existing.children = mergeTree(
          existing.children ?? [],
          extraChildren,
        );
      }
    };

    const mergeTree = (base: any[], extra: any[]): any[] => {
      const list = [...base];
      for (const extraItem of extra) {
        const existing = findMatch(list, extraItem);
        if (existing) {
          mergeNode(existing, extraItem);
        } else {
          if (extraItem.sort === undefined) {
            extraItem.sort = 9999;
          }
          list.push(extraItem);
        }
      }
      return list;
    };

    return mergeTree(backendMenus, backendRoutes).toSorted((a, b) => {
      const sortA = a.sort ?? 0;
      const sortB = b.sort ?? 0;
      return sortA - sortB;
    });
  }

  /**
   * 一次性扫描所有插件路由，同时收集前端和后端格式
   */
  scan(): { backendRoutes: any[]; frontendRoutes: RouteRecordRaw[] } {
    if (this.hasScanned) {
      return {
        frontendRoutes: this.cachedFrontendRoutes,
        backendRoutes: this.cachedBackendRoutes,
      };
    }

    const frontendRoutes: RouteRecordRaw[] = [];
    const backendRoutes: any[] = [];

    // 扫描所有插件路由文件（受模式控制：仅前端模式或开发环境启用）
    const pluginRouteModules = import.meta.glob(
      '../../plugin/**/routes{.ts,/index.ts}',
      { eager: true },
    );

    // 扫描 routes/backend.ts 中的后端模式路由（框架固有路由，始终收集）
    const backendModeRouteModules = import.meta.glob('../routes/backend.ts', {
      eager: true,
    });

    // 仅在「前端模式」或「开发环境」下收集插件静态路由，
    // 避免 backend/mixed 模式 + 生产环境时与后端返回的路由冲突
    const pluginStaticEnabled = this.isPluginStaticEnabled();

    Object.entries(pluginRouteModules).forEach(([filePath, module]) => {
      if (!pluginStaticEnabled) {
        if (this.isDev) {
          const pluginName = filePath
            .replace('../../plugin/', '')
            .split('/')[0];
          console.warn(
            `[PluginScanner] ⏭️  跳过插件 ${pluginName} 静态路由（当前为后端模式且非开发环境，路由以后端返回为准）`,
          );
        }
        return;
      }
      try {
        // 从路径提取插件名，比如 '../../plugin/demo/routes.ts' → 'demo'
        const pluginName = filePath.replace('../../plugin/', '').split('/')[0];
        if (!pluginName) return;

        // 解析路由导出
        let routes: any[] = [];
        const mod = module as { default?: any[]; routes?: any[] };
        if (Array.isArray(mod)) {
          routes = mod;
        } else if (Array.isArray(mod.default)) {
          routes = mod.default;
        } else if (Array.isArray(mod.routes)) {
          routes = mod.routes;
        }

        if (!Array.isArray(routes) || routes.length === 0) {
          if (this.isDev) {
            console.warn(`[PluginScanner] ℹ️ 插件 ${pluginName} 未定义路由`);
          }
          return;
        }

        // 遍历路由，自动注入模块名，分类处理
        const processedRoutes = this.processRoutes(routes, pluginName);
        frontendRoutes.push(...processedRoutes.frontend);
        backendRoutes.push(...processedRoutes.backend);

        if (this.isDev) {
          console.warn(
            `[PluginScanner] ✅ 插件 ${pluginName} 扫描完成：前端路由 ${processedRoutes.frontend.length} 个，后端路由 ${processedRoutes.backend.length} 个`,
          );
        }
      } catch (error) {
        // 错误隔离：单个插件错误不影响全局
        console.error(
          `[PluginScanner] ❌ 插件路由扫描失败，文件路径：${filePath}`,
          error,
        );
      }
    });

    // 处理 routes/backend.ts 中的后端模式路由
    Object.entries(backendModeRouteModules).forEach(([_filePath, module]) => {
      try {
        const mod = module as { default?: any[]; routes?: any[] };
        let routes: any[] = [];

        if (Array.isArray(mod)) {
          routes = mod;
        } else if (Array.isArray(mod.default)) {
          routes = mod.default;
        } else if (Array.isArray(mod.routes)) {
          routes = mod.routes;
        }

        if (!Array.isArray(routes) || routes.length === 0) {
          if (this.isDev) {
            console.warn(`[PluginScanner] ℹ️ routes/backend.ts 未定义路由`);
          }
          return;
        }

        // 后端模式路由的 component 为字符串，直接加入后端路由列表
        routes.forEach((route) => {
          if (typeof route.component === 'string') {
            backendRoutes.push(route);
          }
        });

        if (this.isDev) {
          console.warn(
            `[PluginScanner] ✅ routes/backend.ts 扫描完成：后端路由 ${routes.length} 个`,
          );
        }
      } catch (error) {
        console.error(`[PluginScanner] ❌ routes/backend.ts 扫描失败`, error);
      }
    });

    this.cachedFrontendRoutes = frontendRoutes;
    this.cachedBackendRoutes = backendRoutes;
    this.hasScanned = true;

    return { frontendRoutes, backendRoutes };
  }

  /**
   * 处理路由，自动注入模块名，分类、校验
   */
  private processRoutes(
    routes: any[],
    pluginName: string,
    parentMeta?: Record<string, any>,
  ): { backend: any[]; frontend: RouteRecordRaw[] } {
    const frontend: RouteRecordRaw[] = [];
    const backend: any[] = [];

    routes.forEach((route) => {
      if (!route || typeof route !== 'object') return;

      // 合并父级meta
      const meta = { ...parentMeta, ...route.meta };
      // 自动注入模块名：如果没有手动配置，默认使用当前插件名
      if (!meta.module) {
        meta.module = pluginName;
      }
      const processedRoute = { ...route, meta };

      // 处理子路由
      let children: null | { backend: any[]; frontend: RouteRecordRaw[] } =
        null;
      if (
        Array.isArray(processedRoute.children) &&
        processedRoute.children.length > 0
      ) {
        children = this.processRoutes(
          processedRoute.children,
          pluginName,
          meta,
        );
      }

      // 分类处理
      if (typeof processedRoute.component === 'function') {
        // 前端路由
        frontend.push(processedRoute as RouteRecordRaw);
      } else if (
        processedRoute.component === 'BasicLayout' ||
        processedRoute.component === 'RouteView' ||
        (!processedRoute.component &&
          Array.isArray(processedRoute.children) &&
          processedRoute.children.length > 0)
      ) {
        // 布局组件或空 component 的分组路由：视为后端路由的分组
        if (children?.backend?.length) {
          processedRoute.children = children.backend;
        }
        backend.push(processedRoute);
      } else if (typeof processedRoute.component === 'string') {
        // 后端路由：开发环境下校验路径
        if (this.isDev) {
          this.validateComponentPath(
            processedRoute.component,
            meta.module,
            route.path,
            pluginName,
          );
        }
        // 合并子路由
        if (children?.backend?.length) {
          processedRoute.children = children.backend;
        }
        backend.push(processedRoute);
      }

      // 子路由中的前端路由也要加入结果
      if (children?.frontend?.length) {
        frontend.push(...children.frontend);
      }
    });

    return { frontend, backend };
  }

  /**
   * 开发环境校验组件路径是否存在
   */
  private validateComponentPath(
    component: string,
    module: string,
    routePath: string,
    pluginName: string,
  ): void {
    if (!this.pageMap || !component) return;

    // 路径自动补全逻辑，和generate-routes-backend保持一致
    let fullPath = component;
    // 如果是最简路径，补全模块前缀
    if (
      module &&
      !component.startsWith('plugin/') &&
      !component.startsWith('views/')
    ) {
      const moduleComponent = component.replace(/^\//, '');
      // 自动补全规则：如果带后缀直接用，否则补全index.vue
      if (moduleComponent.endsWith('.vue')) {
        fullPath = `../../plugin/${module}/views/${moduleComponent}`;
      } else if (moduleComponent.includes('/')) {
        fullPath = `../../plugin/${module}/views/${moduleComponent}.vue`;
      } else {
        fullPath = `../../plugin/${module}/views/${moduleComponent}/index.vue`;
      }
    } else if (!component.endsWith('.vue')) {
      // 全路径补全后缀
      fullPath = `../../${component}.vue`;
    }

    // 校验路径是否存在
    if (!this.pageMap[fullPath]) {
      console.warn(
        `[PluginScanner] ⚠️  插件 ${pluginName} 的路由 ${routePath} 组件路径不存在`,
        `\n配置的路径: ${component}`,
        `\n解析后的路径: ${fullPath}`,
        `\n请检查文件是否存在`,
      );
    }
  }
}

// 全局单例
export const pluginRouteScanner = new PluginRouteScanner();
