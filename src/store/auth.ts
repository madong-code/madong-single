import type { Recordable } from '#/core/shared/types';

import type { TenantOption } from '#/api/core/auth';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '#/core/shared/constants';
import { preferences } from '#/core/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '#/core/stores';

import { defineStore } from 'pinia';

import {
  getAccessCodesApi,
  getUserInfoApi,
  getUserTenantListApi,
  loginApi,
  logoutApi,
  switchTenantApi,
} from '#/api';
import {
  destroyMenuBadgePush,
  useMenuBadgePush,
} from '#/hooks/use-menu-badge-push';
import { resetRoutes as resetRouterRoutes } from '#/router';
import { generateAccess } from '#/router/access';
import { accessRoutes } from '#/router/routes';
import { useMenuBadgeStore } from '#/store/modules/menu-badge';
import { useNotifyStore } from '#/store/modules/notify';
import { useSiteConfigStore } from '#/store/modules/site-config';
import { extractBadgesFromMenus } from '#/utils/menu-badge';
import {
  startBadgeApplier,
  stopBadgeApplier,
} from '#/utils/menu-badge-applier';
import { destroyPushClient } from '#/utils/push/client';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const tenantList = ref<TenantOption[]>([]);
  const tenantListLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params);
      const { access_token: accessToken, refresh_token: refreshToken } =
        loginResult;

      // 如果成功获取到 accessToken
      if (accessToken) {
        // 将 accessToken 和 refreshToken 存储到 accessStore 中
        accessStore.setAccessToken(accessToken);
        accessStore.setRefreshToken(refreshToken);
        // 存储租户ID（多租户模式）：优先取登录响应中的租户，
        // 兼容「下拉选择(tenant_id)」与「租户代码(tenant_code)」两种登录方式
        const tenantId = loginResult.tenant?.id ?? params.tenant_id;
        if (tenantId) {
          accessStore.setTenantId(tenantId);
        }

        // 登录成功后立即预加载权限码，确保路由渲染（权限判断钩子）前权限码已就绪。
        // 避免「刚登录时按钮缺失、刷新后正常」的时序竞态；失败不阻塞登录，由路由守卫补偿。
        try {
          const accessCodes = await getAccessCodesApi();
          accessStore.setAccessCodes(accessCodes);
        } catch {
          // 预加载失败由 setupAccessGuard 补偿加载
        }

        // 登录成功后重新拉取站点配置，覆盖登录页使用的平台配置（Logo/标题/Favicon）
        // 必须在进入主布局前完成，否则会短暂展示登录页的平台品牌
        try {
          await useSiteConfigStore().syncTenantPreferences();
        } catch {
          // 站点配置同步失败不阻塞登录
        }

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(preferences.app.defaultHomePath);
        }
      }
    } finally {
      loginLoading.value = false;
    }
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }

    // 0. 销毁 WS 连接与徽标订阅（须在 resetAllStores 前，避免残留旧租户订阅）
    destroyMenuBadgePush();
    stopBadgeApplier();
    destroyPushClient();
    useMenuBadgeStore().clearAll();

    // 1. 重置所有 store（access/user/siteConfig/tabbar...），siteConfig.$reset 已包含 clearTenantConfig
    resetAllStores();

    // 2. 强制清除 token 并写入 storage，防止 pinia-plugin-persistedstate 在 $reset 后恢复旧 token
    accessStore.$patch({
      accessToken: null,
      refreshToken: null,
      tenantId: null,
    });

    // 3. 回登录页（路由守卫检测 accessToken 为空 → 放行）
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  /**
   * 获取当前用户的租户列表（已登录状态下的租户切换）
   */
  async function fetchTenantList() {
    tenantListLoading.value = true;
    try {
      tenantList.value = await getUserTenantListApi();
      return tenantList.value;
    } finally {
      tenantListLoading.value = false;
    }
  }

  /**
   * 切换当前租户
   * @param tenantId 目标租户ID
   */
  async function switchTenant(tenantId: number | string): Promise<void> {
    const result = await switchTenantApi(tenantId);

    // 更新 token
    accessStore.setAccessToken(result.access_token);
    accessStore.setRefreshToken(result.refresh_token);
    accessStore.setTenantId(String(tenantId));

    // 重新加载用户信息和权限（新租户上下文）
    const [userInfo, accessCodes] = await Promise.all([
      fetchUserInfo(),
      getAccessCodesApi(),
    ]);

    // 后端 getUserInfo 不返回 current_tenant，从切换响应中注入
    if (result.tenant) {
      (userInfo as Record<string, any>).current_tenant = result.tenant;
    }
    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(accessCodes);

    // 切换后重新获取租户配置并同步到 preferences（logo/标题/favicon）
    const siteConfigStore = useSiteConfigStore();
    await siteConfigStore.syncTenantPreferences();

    // 重置路由后重新生成新租户的菜单和路由
    resetRouterRoutes();

    const userRoles = userInfo.roles ?? [];
    const { accessibleMenus, accessibleRoutes: newAccessRoutes } =
      await generateAccess({
        roles: userRoles,
        router,
        routes: accessRoutes,
      });

    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(newAccessRoutes);

    // 重建租户相关的 WS 订阅：销毁旧连接（旧租户频道）后按新租户重订
    const notifyStore = useNotifyStore();
    destroyMenuBadgePush();
    notifyStore.$reset();
    destroyPushClient();

    useMenuBadgeStore().initBadges(extractBadgesFromMenus(accessibleMenus));
    useMenuBadgePush();
    notifyStore.initPush();
    startBadgeApplier();
  }

  function $reset() {
    loginLoading.value = false;
    tenantList.value = [];
  }

  return {
    $reset,
    authLogin,
    fetchTenantList,
    fetchUserInfo,
    loginLoading,
    logout,
    switchTenant,
    tenantList,
    tenantListLoading,
  };
});
