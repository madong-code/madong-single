import { ref } from 'vue';

// src/store/modules/site-config.ts
import { defineStore } from 'pinia';

import { getSiteInfoApi } from '#/api';
import { ConfigService } from '#/api/system/config';
import { buildStaticUrl } from '#/utils/url';
import { prefetchSignedUrls } from '#/utils/url/private-storage';

// 定义站点配置接口（平台配置 + 租户配置共用）
// 平台配置：从 /auth/site-info 获取，code='site_setting_platform'
// 租户配置：从 /system/config/code/site_setting 获取
// 两者字段完全一致，只是内容不同
interface SystemConfig {
  logo?: string; // 站点Logo（来自后端 site_logo）
  title?: string; // 站点名称（来自后端 site_name）
  favicon?: string; // 站点图标（来自后端 site_favicon）
  copyright?: string; // 版权信息（来自后端 site_copyright）
  static_url?: string; // 静态资源base URL（CDN配置）
  cdnUrl?: string; // 兼容旧版CDN URL
  cdnUrlParams?: string; // CDN URL参数
  site_open?: number;
  site_url?: string;
  site_description?: string;
  site_record_no?: string;
  site_icp_url?: string;
  site_network_security?: string;
  site_network_security_url?: string;
  [key: string]: any; // 保留后端原始字段
}

/**
 * 站点配置映射函数
 * 将后端 snake_case 字段映射为前端 camelCase
 * 平台和租户共用同一个映射，只是数据源不同
 */
function mapSiteConfig(source: Record<string, any>): SystemConfig {
  return {
    logo: source?.site_logo || '',
    title: source?.site_name || '',
    favicon: source?.site_favicon || '',
    copyright: source?.site_copyright || '',
    site_open: source?.site_open,
    site_url: source?.site_url,
    site_description: source?.site_description,
    site_record_no: source?.site_record_no,
    site_icp_url: source?.site_icp_url,
    site_network_security: source?.site_network_security,
    site_network_security_url: source?.site_network_security_url,
    // 保留其他所有字段（如 static_url, cdnUrl, cdnUrlParams 等）
    ...source,
  };
}

/**
 * 站点配置状态管理
 *
 * 双状态设计：
 * - platformConfig：登录前获取的平台级配置（持久存在，退出不清空）
 * - tenantConfig：登录后获取的租户级配置（退出时清空）
 */
export const useSiteConfigStore = defineStore('siteConfig', () => {
  // ==================== 状态 ====================

  // ── 登录前：平台级配置 ──
  // 生命周期：bootstrap → 整个会话（退出不清空）
  const platformConfig = ref<SystemConfig>({});
  const platformLoading = ref(false);
  const platformIsLoaded = ref(false);
  const platformError = ref<null | string>(null);

  // ── 登录后：租户级配置 ──
  // 生命周期：登录成功 → 退出清空
  const tenantConfig = ref<SystemConfig>({});
  const tenantLoading = ref(false);
  const tenantIsLoaded = ref(false);
  const tenantError = ref<null | string>(null);

  // ==================== Actions ====================

  /**
   * 获取站点信息（登录前，不需要 Token）
   * GET /auth/site-info → 后端直接返回站点配置（SaaS 取平台分组，标准版取 default 分组）
   * 两端接口同名，前端单次请求即可；silent 保证个别后端缺接口时不弹提示
   */
  const fetchPlatformConfig = async () => {
    if (platformLoading.value) return;
    platformLoading.value = true;
    platformError.value = null;

    try {
      const response = (await getSiteInfoApi()) as any;
      platformConfig.value = mapSiteConfig(response as any);
      platformIsLoaded.value = true;

      // 缓存到 localStorage，供 loading.html 在下次启动时读取
      // 有配置值才缓存，无则不存（loading.html 读取不到就不会设置，保留硬编码 fallback）
      try {
        const primaryColor =
          platformConfig.value.primaryColor ||
          platformConfig.value.site_primary_color ||
          platformConfig.value.primary_color;
        const cacheData: Record<string, any> = {
          title: platformConfig.value.title,
          logo: platformConfig.value.logo,
          favicon: platformConfig.value.favicon,
        };
        if (primaryColor) {
          cacheData.primaryColor = primaryColor;
        }
        localStorage.setItem('__site_config__', JSON.stringify(cacheData));
      } catch {
        // 忽略缓存写入失败
      }
    } catch (error: any) {
      platformError.value = error.message || '获取站点信息失败';
      console.warn('获取平台配置失败（不影响登录）:', error);
    } finally {
      platformLoading.value = false;
    }
  };

  /**
   * 获取租户级配置（登录后，带 X-Tenant-Id）
   * GET /system/config/code/site_setting → 使用独立 code 'site_setting'
   * 结果写入 tenantConfig，使用 mapSiteConfig 转换格式
   */
  const fetchTenantConfig = async (code = 'site_setting') => {
    if (tenantLoading.value) return;
    tenantLoading.value = true;
    tenantError.value = null;

    try {
      const response = (await ConfigService.getByCode(code)) as any;
      tenantConfig.value = mapSiteConfig(response as any);
      tenantIsLoaded.value = true;
    } catch (error: any) {
      tenantError.value = error.message || '获取系统配置失败';
      console.error('获取租户配置失败:', error);
    } finally {
      tenantLoading.value = false;
    }
  };

  /**
   * 清空租户配置（退出登录时调用）
   * 不影响 platformConfig（登录页复用平台品牌）
   */
  const clearTenantConfig = () => {
    tenantConfig.value = {};
    tenantLoading.value = false;
    tenantError.value = null;
    tenantIsLoaded.value = false;
  };

  /**
   * 重置所有配置
   */
  const resetConfig = () => {
    tenantConfig.value = {};
    tenantError.value = null;
    tenantIsLoaded.value = false;
    platformConfig.value = {};
    platformError.value = null;
    platformIsLoaded.value = false;
    // 清理内存后，同时清除 localStorage 缓存
    try {
      localStorage.removeItem('__site_config__');
    } catch {
      // 忽略清理失败
    }
  };

  // resetAllStores() 依赖 $reset()，setup 语法 store 需要手动实现
  // $reset 只清空租户配置，保留平台配置（退出登录后登录页仍能显示平台品牌信息）
  const $reset = clearTenantConfig;

  /**
   * 获取当前有效配置（优先租户，回退平台）
   * 用于 App.vue 动态更新 document.title / favicon
   */
  const getCurrentConfig = (): SystemConfig => {
    if (tenantIsLoaded.value && tenantConfig.value.title) {
      return tenantConfig.value;
    }
    if (platformIsLoaded.value && platformConfig.value.title) {
      return platformConfig.value;
    }
    return tenantConfig.value;
  };

  /**
   * 获取存储相关配置（upload_mode / cdn_url / static_url / is_private / storage_prefix）
   *
   * 与 getCurrentConfig() 的区别：后者带 title 兜底，租户未配置站点名称时会整体回退到
   * 平台配置；而存储字段只由租户的 site_setting 下发（后端 appendUploadInfo 追加），
   * 一旦回退就会丢失 is_private / static_url，导致私有模式与云存储前缀失效。
   */
  const getStorageConfig = (): SystemConfig =>
    tenantIsLoaded.value ? tenantConfig.value : platformConfig.value;

  /**
   * 获取租户配置并同步到 preferences（logo/标题/favicon）
   * 供 settings 保存后、登录后、切换租户后统一调用
   *
   * 内部已做异常保护，不会因租户配置获取失败而中断调用方流程
   * （登录后参数校验、路由跳转等不应被站点配置请求阻塞）
   */
  const syncTenantPreferences = async () => {
    try {
      await fetchTenantConfig();
    } catch {
      console.warn('获取租户配置失败，使用平台配置作为回退');
    }

    // 站点名称：租户优先，未配置 site_name 时回退平台品牌名
    const title = tenantConfig.value.title || platformConfig.value.title;

    // Logo / favicon 及其存储字段取「已配置 logo 的一方」：
    // 不能用 getCurrentConfig()——它要求租户配置存在 site_name，否则整体回退平台配置，
    // 导致租户只配置了 Logo、未配置站点名称时，Logo 始终被平台 Logo 覆盖
    const storage = tenantConfig.value.logo
      ? tenantConfig.value
      : platformConfig.value;

    if (!title && !storage.logo) {
      return; // 无可用配置，跳过同步
    }

    // 私有空间下 logo / favicon 不能在前端拼接，需先换取带签名的临时直链，
    // 否则写入 preferences 的会是不可访问的地址
    await prefetchSignedUrls([storage.logo, storage.favicon], storage);

    const { updatePreferences } = await import('#/core/preferences');
    const updates: Record<string, any> = {};
    if (title) updates.app = { name: title };
    // 必须用「提供该 logo 的配置」自身的存储字段拼地址：
    // 多租户模式下回退到平台配置时，logo 在平台公开空间，用租户私有空间域名拼接会 401
    const logoUrl = buildStaticUrl(
      storage.logo || '',
      storage.static_url,
      true,
      storage,
    );
    updates.logo = {
      source: logoUrl || '/logo.png',
      sourceDark: logoUrl || '/logo.png',
    };
    updatePreferences(updates);
    if (storage.favicon) {
      const faviconLink =
        document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (faviconLink) {
        faviconLink.href = buildStaticUrl(
          storage.favicon,
          storage.static_url,
          true,
          storage,
        );
      }
    }
  };

  return {
    platformConfig,
    platformLoading,
    platformIsLoaded,
    platformError,
    tenantConfig,
    tenantLoading,
    tenantIsLoaded,
    tenantError,
    fetchPlatformConfig,
    fetchTenantConfig,
    clearTenantConfig,
    resetConfig,
    getCurrentConfig,
    getStorageConfig,
    syncTenantPreferences,
    $reset,
  };
});
