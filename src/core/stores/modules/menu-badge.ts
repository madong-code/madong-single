import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

/**
 * 菜单徽标数据结构
 */
export interface MenuBadgeData {
  badge?: string | number;
  badgeType?: 'dot' | 'normal';
  badgeVariants?: string;
}

export type MenuBadgeMap = Record<string, MenuBadgeData>;

export const useMenuBadgeStore = defineStore('menu-badge', () => {
  /** 徽标数据: key 为菜单 path */
  const badges = ref<MenuBadgeMap>({});

  /**
   * 计算父级菜单徽标 (子菜单待办汇总)
   * 当某个子菜单有徽标时，父级自动显示一个小红点
   */
  const parentBadges = computed(() => {
    const result: MenuBadgeMap = {};
    for (const [path] of Object.entries(badges.value)) {
      const parts = path.split('/').filter(Boolean);
      for (let i = 1; i < parts.length; i++) {
        const parentPath = '/' + parts.slice(0, i).join('/');
        if (!result[parentPath]) {
          result[parentPath] = {
            badgeType: 'dot',
            badgeVariants: 'destructive',
          };
        }
      }
    }
    return result;
  });

  /** 初始化徽标数据 (登录后调用) */
  function initBadges(initialData: MenuBadgeMap) {
    badges.value = { ...initialData };
  }

  /** 更新单个菜单徽标 */
  function updateBadge(path: string, data: MenuBadgeData) {
    badges.value[path] = { ...data };
  }

  /** 批量更新徽标 */
  function batchUpdateBadges(updates: MenuBadgeMap) {
    badges.value = { ...badges.value, ...updates };
  }

  /** 清除指定菜单徽标 */
  function clearBadge(path: string) {
    delete badges.value[path];
  }

  /** 清除所有徽标 */
  function clearAll() {
    badges.value = {};
  }

  /** 获取某个路径的完整徽标数据 (包含父级计算) */
  function getBadgeForPath(path: string): MenuBadgeData | undefined {
    return badges.value[path] || parentBadges.value[path];
  }

  return {
    badges,
    parentBadges,
    initBadges,
    updateBadge,
    batchUpdateBadges,
    clearBadge,
    clearAll,
    getBadgeForPath,
  };
});
