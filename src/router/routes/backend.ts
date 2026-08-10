import type { RouteRecordStringComponent } from '#/core/shared/types';

/**
 * 后端模式路由定义
 *
 * 此文件专门用于定义后端菜单模式下的前端路由。
 * 路由使用字符串形式的 component，由后端菜单系统动态加载。
 *
 * 路由特点：
 * - component 为字符串路径，如 '/system/user-center/index.vue'
 * - hideInMenu: true 表示不在前端菜单中显示，但可通过URL访问
 * - 无需在前端静态路由中重复定义
 */
const backendRoutes: RouteRecordStringComponent[] = [
  /**
   * 个人中心路由
   * 后端菜单模式下，此路由由后端菜单系统管理
   * 前端仅定义路由入口，不显示在侧边菜单
   */
  {
    name: 'Profile',
    path: '/profile',
    component: '/_core/profile/index',
    meta: {
      hideInMenu: true,
      hideInBreadcrumb: false,
      title: '个人中心',
      module: 'system',
    },
  },
  {
    name: 'ConfigCommon',
    path: '/system/config-common',
    component: '/system/config/components/common',
    meta: {
      hideInMenu: true,
      hideInBreadcrumb: false,
      title: '通用配置',
      module: 'system',
    },
  },
];

export default backendRoutes;
