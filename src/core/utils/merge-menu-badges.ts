import type { MenuRecordRaw } from '#/core/shared/types/base/menu-record';
import type {
  MenuBadgeData,
  MenuBadgeMap,
} from '#/core/stores/modules/menu-badge';

/**
 * 后端 badge 数据结构 (snake_case)
 * 与前端内部 camelCase 之间的映射
 */
interface RawBadgeData {
  badge?: string | number;
  badge_type?: 'dot' | 'normal';
  badge_variants?: string;
}

/**
 * 将后端 snake_case 徽标数据映射为前端内部 camelCase 格式
 */
function mapBadgeToInternal(raw: RawBadgeData): MenuBadgeData {
  return {
    badge: raw.badge,
    badgeType: raw.badge_type,
    badgeVariants: raw.badge_variants,
  };
}

/**
 * 将徽标数据合并到菜单树中
 * 接受后端 snake_case 或前端 camelCase 格式，统一映射后合并
 *
 * @param menus    原始菜单树
 * @param badgeMap 徽标数据映射 (key 为菜单 path)
 * @returns 合并徽标后的菜单树 (不修改原数据)
 */
export function mergeMenuBadges(
  menus: MenuRecordRaw[],
  badgeMap: MenuBadgeMap,
): MenuRecordRaw[] {
  return menus.map((menu) => {
    const badgeData = badgeMap[menu.path];
    const mergedMenu: MenuRecordRaw = {
      ...menu,
      ...(badgeData
        ? ({
            badge: badgeData.badge,
            badgeType: badgeData.badgeType,
            badgeVariants: badgeData.badgeVariants,
          } as Partial<MenuRecordRaw>)
        : {}),
    };

    if (menu.children && menu.children.length > 0) {
      mergedMenu.children = mergeMenuBadges(menu.children, badgeMap);
    }

    return mergedMenu;
  });
}

/**
 * 从后端菜单数据中提取徽标信息
 * 处理 snake_case (badge_type, badge_variants) 和 camelCase 两种格式
 * 用于登录后初始化 badge store
 *
 * @param menus 包含 badge 信息的菜单树
 * @returns 徽标数据映射 (内部 camelCase 格式)
 */
export function extractBadgesFromMenus(menus: any[]): MenuBadgeMap {
  const result: MenuBadgeMap = {};

  const walk = (items: any[]) => {
    for (const item of items) {
      const hasBadge = item.badge !== undefined && item.badge !== null;
      const hasBadgeType =
        item.badgeType !== undefined || item.badge_type !== undefined;

      if (hasBadge || hasBadgeType) {
        // 兼容 snake_case 和 camelCase
        result[item.path] = {
          badge: item.badge,
          badgeType: item.badgeType ?? item.badge_type ?? 'normal',
          badgeVariants: item.badgeVariants ?? item.badge_variants ?? 'primary',
        };
      }
      if (item.children && item.children.length > 0) {
        walk(item.children);
      }
    }
  };

  walk(menus);
  return result;
}

/**
 * 从 WebSocket 推送消息中提取徽标数据
 * 处理 snake_case 格式 (badge_type, badge_variants)
 *
 * @param data WebSocket 推送的徽标数据
 * @returns 内部 camelCase 格式的徽标数据
 */
export function mapPushBadgeDataToInternal(data: any): MenuBadgeData {
  return {
    badge: data.badge,
    badgeType: data.badge_type ?? data.badgeType ?? 'normal',
    badgeVariants: data.badge_variants ?? data.badgeVariants ?? 'primary',
  };
}

export { mapBadgeToInternal };
