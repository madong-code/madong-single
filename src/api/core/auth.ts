import { baseRequestClient, requestClient } from '#/api/request';

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  client_id: string;
  expires_time: number;
  tenant?: {
    code: string;
    database_mode: string;
    id: number | string;
    name: string;
  };
}

export interface TenantOption {
  id: number | string;
  name: string;
  code: string;
  domain: string;
  database_mode: string;
  database_name: string;
  is_default?: boolean;
}

/**
 * 获取当前登录用户的租户列表（已登录状态下的租户切换用）
 */
export async function getUserTenantListApi() {
  return requestClient.get<TenantOption[]>('/system/auth/tenant-list');
}

/**
 * 切换当前登录用户的租户
 */
export async function switchTenantApi(tenantId: number | string) {
  return requestClient.post<LoginResult>('/system/auth/switch-tenant', {
    tenant_id: tenantId,
  });
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post('/system/auth/refresh-token', {
    refresh_token: refreshToken,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/system/auth/perm-code');
}
