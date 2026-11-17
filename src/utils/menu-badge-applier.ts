import type { MenuBadgeData, MenuBadgeMap } from '#/store/modules/menu-badge';

import { watch } from 'vue';

import { useAccessStore } from '#/core/stores';

import { useMenuBadgeStore } from '#/store/modules/menu-badge';

/** 设置节点徽标（经 pinia 代理原地写回，触发侧栏重渲染） */
function setBadge(menu: any, data: MenuBadgeData): void {
  if (data.badge !== undefined) menu.badge = String(data.badge);
  if (data.badgeType !== undefined) menu.badgeType = data.badgeType;
  if (data.badgeVariants !== undefined) menu.badgeVariants = data.badgeVariants;
}

/** 清除节点徽标 */
function clearBadge(menu: any): void {
  menu.badge = undefined;
  menu.badgeType = undefined;
  menu.badgeVariants = undefined;
}

/**
 * 将徽标（含父级冒泡）原地写回 accessStore.accessMenus，经 pinia 代理触发重渲染。
 *
 * 注意：真实菜单树并非 path 层级（如 `/content/message/notify` 的父级是 `/network`），
 * 因此父级红点必须在**真实菜单树**上递归冒泡计算（依据子节点是否命中徽标），
 * 而不能依赖 `path` 前缀切分——后者会在「同前缀但非真实父级」的菜单上产生误报红点。
 */
export function applyBadgesToAccessMenus(badges: MenuBadgeMap): void {
  const accessStore = useAccessStore();

  const walk = (menus: any[]): boolean => {
    let hasBadgeInSubtree = false;
    for (const menu of menus) {
      const childHasBadge = menu.children?.length ? walk(menu.children) : false;
      const explicit = badges[menu.path];

      if (explicit) {
        setBadge(menu, explicit);
        hasBadgeInSubtree = true;
      } else if (childHasBadge) {
        // 子级有徽标 → 当前节点冒泡显示红点
        setBadge(menu, {
          badge: '',
          badgeType: 'dot',
          badgeVariants: 'destructive',
        });
        hasBadgeInSubtree = true;
      } else {
        clearBadge(menu);
      }
    }
    return hasBadgeInSubtree;
  };

  walk(accessStore.accessMenus);
}

let stopHandle: (() => void) | null = null;

/**
 * 启动徽标应用器：监听 badge store，实时写回 accessMenus（幂等，重复调用不会叠加监听）
 */
export function startBadgeApplier(): void {
  if (stopHandle) return;

  const badgeStore = useMenuBadgeStore();
  stopHandle = watch(
    () => badgeStore.badges,
    (badges) => applyBadgesToAccessMenus(badges),
    { deep: true, immediate: true },
  );
}

/** 停止徽标应用器（登出时调用） */
export function stopBadgeApplier(): void {
  if (stopHandle) {
    stopHandle();
    stopHandle = null;
  }
}