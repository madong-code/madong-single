// @ts-expect-error: push-vue.js has no type declarations
import { Push } from './push-vue.js';

let pushClient: InstanceType<typeof Push> | null = null;
const channelCache = new Map<string, any>();

function isWssEnabled(): boolean {
  return import.meta.env.VITE_GLOB_ENABLE_WSS === 'true';
}

function getWssConfig(): null | { appKey: string; url: string } {
  const wssUrl = import.meta.env.VITE_GLOB_WSS_URL;
  const appKey = import.meta.env.VITE_GLOB_WSS_APPKEY;
  if (!wssUrl || !appKey) {
    console.warn('[PushClient] WSS 未配置');
    return null;
  }
  return { url: wssUrl, appKey };
}

/**
 * 获取全局 Push 单例（admin 端仅一条 WS 连接，notify 与 badge 共用）
 */
export function getPushClient(): InstanceType<typeof Push> | null {
  if (!isWssEnabled()) return null;

  if (!pushClient) {
    const config = getWssConfig();
    if (!config) return null;

    pushClient = new Push({
      url: config.url,
      app_key: config.appKey,
      auth: '/adminapi/plugin/webman/push/auth',
    });

    console.log('[PushClient] WebSocket 连接已创建');
  }

  return pushClient;
}

/**
 * 订阅频道（带缓存，避免重复订阅）
 */
export function subscribeChannel(channelName: string): any | null {
  const client = getPushClient();
  if (!client) return null;

  if (channelCache.has(channelName)) {
    return channelCache.get(channelName);
  }

  const channel = client.subscribe(channelName);
  channelCache.set(channelName, channel);

  console.log(`[PushClient] 订阅频道: ${channelName}`);

  return channel;
}

/**
 * 订阅当前用户频道
 * admin 端频道格式：backend-admin-{tenantId}-{userId}（与后端 MenuBadgePushService::buildChannels 一致）
 */
export function subscribeUserChannel(
  tenantId: number | string,
  userId: string,
): any | null {
  return subscribeChannel(`backend-admin-${tenantId}-${userId}`);
}

export function destroyPushClient(): void {
  channelCache.clear();
  if (pushClient) {
    pushClient.disconnect();
    pushClient = null;
    console.log('[PushClient] WebSocket 连接已销毁');
  }
}

export function resetPushClient(): void {
  destroyPushClient();
}
