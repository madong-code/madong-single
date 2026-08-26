import type { RouteRecordRaw } from 'vue-router';

import type { MenuRecordRaw } from '#/core/shared/types/base';

import { acceptHMRUpdate, defineStore } from 'pinia';

import {
  extractBadgesFromMenus,
  mergeMenuBadges,
} from '#/core/utils/merge-menu-badges';
import { useMenuBadgeStore } from './menu-badge';

type AccessToken = null | string;

interface AccessState {
  /**
   * 权限码
   */
  accessCodes: string[];
  /**
   * 可访问的菜单列表
   */
  accessMenus: MenuRecordRaw[];
  /**
   * 可访问的路由列表
   */
  accessRoutes: RouteRecordRaw[];
  /**
   * 登录 accessToken
   */
  accessToken: AccessToken;
  /**
   * 是否已经检查过权限
   */
  isAccessChecked: boolean;
  /**
   * 是否锁屏状态
   */
  isLockScreen: boolean;
  /**
   * 锁屏密码
   */
  lockScreenPassword?: string;
  /**
   * 登录是否过期
   */
  loginExpired: boolean;
  /**
   * 登录 refreshToken
   */
  refreshToken: AccessToken;
  /**
   * 超级权限码，拥有这些权限码的用户被视为拥有所有权限
   * @default ['*']
   */
  superCodes: string[];
}

/**
 * @zh_CN 访问权限相关
 */
export const useAccessStore = defineStore('core-access', {
  actions: {
    getMenuByPath(path: string) {
      function findMenu(
        menus: MenuRecordRaw[],
        path: string,
      ): MenuRecordRaw | undefined {
        for (const menu of menus) {
          if (menu.path === path) {
            return menu;
          }
          if (menu.children) {
            const matched = findMenu(menu.children, path);
            if (matched) {
              return matched;
            }
          }
        }
      }
      return findMenu(this.accessMenus, path);
    },
    lockScreen(password: string) {
      this.isLockScreen = true;
      this.lockScreenPassword = password;
    },
    setAccessCodes(codes: string[]) {
      this.accessCodes = codes;
    },
    setSuperCodes(codes: string[]) {
      this.superCodes = codes;
    },
    setAccessMenus(menus: MenuRecordRaw[]) {
      this.accessMenus = menus;
      // 初始化徽标数据：从后端菜单中提取徽标
      const badgeStore = useMenuBadgeStore();
      const badgeMap = extractBadgesFromMenus(menus);
      badgeStore.initBadges(badgeMap);
    },
    setAccessRoutes(routes: RouteRecordRaw[]) {
      this.accessRoutes = routes;
    },
    setAccessToken(token: AccessToken) {
      this.accessToken = token;
    },
    setIsAccessChecked(isAccessChecked: boolean) {
      this.isAccessChecked = isAccessChecked;
    },
    setLoginExpired(loginExpired: boolean) {
      this.loginExpired = loginExpired;
    },
    setRefreshToken(token: AccessToken) {
      this.refreshToken = token;
    },
    unlockScreen() {
      this.isLockScreen = false;
      this.lockScreenPassword = undefined;
    },
  },
  getters: {
    /**
     * 合并徽标后的菜单树
     * 将 badge store 中的实时徽标数据合并到菜单中
     */
    menusWithBadges: (state) => {
      const badgeStore = useMenuBadgeStore();
      const badgeMap = { ...badgeStore.badges, ...badgeStore.parentBadges };
      return mergeMenuBadges(state.accessMenus, badgeMap);
    },
  },
  persist: {
    // 持久化
    pick: [
      'accessToken',
      'refreshToken',
      'accessCodes',
      'isLockScreen',
      'lockScreenPassword',
    ],
  },
  state: (): AccessState => ({
    accessCodes: [],
    accessMenus: [],
    accessRoutes: [],
    accessToken: null,
    isAccessChecked: false,
    isLockScreen: false,
    lockScreenPassword: undefined,
    loginExpired: false,
    refreshToken: null,
    superCodes: ['*'],
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useAccessStore, hot));
}
