import type { MenuBadgeMap } from '#/store/modules/menu-badge';

import { useUserStore } from '#/core/stores';

import { useMenuBadgeStore } from '#/store/modules/menu-badge';
import { mapPushBadgeDataToInternal } from '#/utils/menu-badge';
import { subscribeUserChannel } from '#/utils/push/client';

let badgeChannel: any = null;
let isInitialized = false;

/**
 * 订阅菜单徽标推送（事件名 menu_badge）
 * 需在登录后 / 生成菜单后调用
 */
export function useMenuBadgePush(): void {
  if (isInitialized && badgeChannel) return;

  const userStore = useUserStore();
  const userId = (userStore.userInfo as Record<string, any>)?.id || '0';
  const tenantId =
    (userStore.userInfo as Record<string, any>)?.current_tenant?.id || '*';

  badgeChannel = subscribeUserChannel(tenantId, String(userId));

  if (!badgeChannel) return;

  badgeChannel.on('menu_badge', (data: any) => {
    handleMenuBadgeMessage(data);
  });

  isInitialized = true;
  console.log('[MenuBadgePush] 菜单徽章推送已初始化');
}

function handleMenuBadgeMessage(message: any): void {
  const badgeStore = useMenuBadgeStore();

  if (!message || !message.type) return;

  switch (message.type) {
    case 'update': {
      const { path } = message.data as { path: string };
      const badgeData = mapPushBadgeDataToInternal(message.data);
      if (path) {
        badgeStore.updateBadge(path, badgeData);
      }
      break;
    }

    case 'batch_update': {
      const updates: MenuBadgeMap = {};
      const items = Array.isArray(message.data) ? message.data : [message.data];
      for (const item of items) {
        if (item.path) {
          const { path } = item;
          const badgeData = mapPushBadgeDataToInternal(item);
          updates[path] = badgeData;
        }
      }
      if (Object.keys(updates).length > 0) {
        badgeStore.batchUpdateBadges(updates);
      }
      break;
    }

    case 'clear': {
      const { path } = message.data as { path: string };
      if (path) {
        badgeStore.clearBadge(path);
      }
      break;
    }

    case 'reset': {
      badgeStore.clearAll();
      break;
    }

    default:
      console.warn('[MenuBadgePush] 未知消息类型:', message.type);
  }
}

export function destroyMenuBadgePush(): void {
  badgeChannel = null;
  isInitialized = false;
}