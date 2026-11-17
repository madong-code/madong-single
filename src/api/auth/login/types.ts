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
}

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

export interface RefreshTokenResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
}

export interface TenantModeFlag {
  enabled: boolean;
  auto_select_first: boolean;
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
