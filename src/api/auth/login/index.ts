import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    user_name?: string;
    password?: string;
    mobile_phone?: string;
    code?: string;
    uuid?: string;
    type?: string;
    grant_type?: string;
    key_id?: string;
    tenant_id?: number | string;
    /** 租户代码（与 tenant_id 二选一，多租户登录） */
    tenant_code?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    client_id: string;
    expires_time: number;
    /** 登录/切换后当前租户信息 */
    tenant?: {
      code: string;
      database_mode: string;
      id: number | string;
      name: string;
    };
  }

  export interface RefreshTokenResult {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  }

  /** 租户模式状态 */
  export interface TenantModeFlag {
    enabled: boolean;
    auto_select_first: boolean;
  }

  /** 租户选项 */
  export interface TenantOption {
    id: number | string;
    name: string;
    code: string;
    domain: string;
    database_mode: string;
    database_name: string;
    is_default?: boolean;
  }

  /** 租户分页结果 */
  export interface TenantPageResult {
    list: AuthApi.TenantOption[];
    total: number;
  }
}

export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/** 租户模式探测：标准后端可能没有该接口，静默失败并返回关闭状态 */
export async function getTenantModeFlagApi() {
  return requestClient
    .get<AuthApi.TenantModeFlag>('/auth/tenant-mode', { silent: true })
    .catch(() => ({ enabled: false, auto_select_first: false }));
}

/** 分页搜索租户（供租户搜索器使用） */
export async function getTenantPageApi(params: {
  keyword?: string;
  page?: number;
  page_size?: number;
} = {}) {
  return requestClient.get<AuthApi.TenantPageResult>('/auth/tenants', {
    params,
  });
}

export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

/**
 * 获取平台站点信息（登录前使用）
 * SaaS 后端返回平台级配置（code=site_setting_platform）；
 * 标准后端没有该接口，静默失败，由调用方降级到 site_setting
 */
export async function getSiteInfoApi() {
  return requestClient.get('/auth/site-info', { silent: true });
}
