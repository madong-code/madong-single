import { ref } from 'vue';

// src/store/modules/site-config.ts
import { defineStore } from 'pinia';

import { getSiteInfoApi } from '#/api';
import { ConfigService } from '#/api/system/config';
import { getInitialPreferences, setPreferences } from '#/core/preferences';
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

const DEFAULT_LOGO = '/logo.png';
const DEFAULT_FAVICON = '/favicon.ico';

/** 后端空配置可能是 null / [] / 非对象，统一归一化为普通对象 */
function normalizeSource(source: unknown): Record<string, any> {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {};
  }
  return source as Record<string, any>;
}

/**
 * 站点配置映射函数
 * 将后端 snake_case 字段映射为前端 camelCase
 * 平台和租户共用同一个映射，只是数据源不同
 */
function mapSiteConfig(source: unknown): SystemConfig {
  const config = normalizeSource(source);
  return {
    logo: config.site_logo || '',
    title: config.site_name || '',
    favicon: config.site_favicon || '',
    copyright: config.site_copyright || '',
    site_open: config.site_open,
    site_url: config.site_url,
    site_description: config.site_description,
    site_record_no: config.site_record_no,
    site_icp_url: config.site_icp_url,
    site_network_security: config.site_network_security,
    site_network_security_url: config.site_network_security_url,
    // 保留其他所有字段（如 static_url, cdnUrl, cdnUrlParams 等）
    ...config,
  };
}

/**
 * 从 __site_config__ 缓存恢复平台品牌。
 * 已登录刷新时不会请求 /auth/site-info，缓存是唯一能拿到平台 Logo/favicon 的来源；
 * 这里只恢复品牌字段，存储运行时字段（static_url/is_private 等）由后台请求校准。
 */
function readPlatformCache(): SystemConfig {
  try {
    const cached = JSON.parse(localStorage.getItem('__site_config__') || '{}');
    return {
      title: typeof cached?.title === 'string' ? cached.title : '',
      logo: typeof cached?.logo === 'string' ? cached.logo : '',
      favicon: typeof cached?.favicon === 'string' ? cached.favicon : '',
    };
  } catch {
    return {};
  }
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
  // 初始化即读缓存，避免刷新后因平台配置未请求而把动态品牌直接回退成静态资源
  const platformConfig = ref<SystemConfig>(readPlatformCache());
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
   * 写入 loading.html 使用的平台品牌缓存。
   * 空配置也必须覆盖：写空字符串后 loading.html 会回退到 env 的标题与内置 favicon，
   * 不再保留上一次（或另一个租户）留下的品牌值。
   */
  const writePlatformCache = (config: SystemConfig) => {
    try {
      const primaryColor =
        config.primaryColor ||
        config.site_primary_color ||
        config.primary_color;
      const cacheData: Record<string, any> = {
        title: config.title || '',
        logo: config.logo || '',
        favicon: config.favicon || '',
      };
      if (primaryColor) {
        cacheData.primaryColor = primaryColor;
      }
      localStorage.setItem('__site_config__', JSON.stringify(cacheData));
    } catch {
      // 忽略缓存写入失败
    }
  };

  /**
   * 获取站点信息（登录前，不需要 Token）
   * GET /auth/site-info → 后端直接返回站点配置（SaaS 取平台分组，标准版取 default 分组）
   * 空响应或请求失败都按空配置覆盖，避免残留旧品牌。
   */
  const fetchPlatformConfig = async () => {
    if (platformLoading.value) return;
    platformLoading.value = true;
    platformError.value = null;

    try {
      const response = (await getSiteInfoApi()) as any;
      platformConfig.value = mapSiteConfig(response);
    } catch (error: any) {
      platformConfig.value = mapSiteConfig({});
      platformError.value = error?.message || '获取站点信息失败';
      console.warn('获取平台配置失败，按空配置处理（不影响登录）:', error);
    } finally {
      platformIsLoaded.value = true;
      writePlatformCache(platformConfig.value);
      platformLoading.value = false;
      // 登录页品牌（含浏览器标签图标）也走同一套 env 兜底逻辑
      void applyBrandPreferences().catch((error) => {
        console.warn('应用平台品牌配置失败:', error);
      });
    }
  };

  // 租户切换时可能有多个请求在飞，仅最后一次（序号最大）允许写入状态
  let tenantFetchSeq = 0;

  /**
   * 获取租户级配置（登录后，带 X-Tenant-Id）
   * GET /system/config/code/site_setting → 使用独立 code 'site_setting'
   * 空响应或请求失败都按空配置覆盖；不写 __site_config__，避免污染登录页/loading 品牌
   */
  const fetchTenantConfig = async (code = 'site_setting') => {
    const seq = ++tenantFetchSeq;
    tenantLoading.value = true;
    tenantError.value = null;

    try {
      const response = (await ConfigService.getByCode(code)) as any;
      if (seq !== tenantFetchSeq) return;
      tenantConfig.value = mapSiteConfig(response);
    } catch (error: any) {
      if (seq !== tenantFetchSeq) return;
      tenantConfig.value = mapSiteConfig({});
      tenantError.value = error?.message || '获取系统配置失败';
      console.warn('获取租户配置失败，按空配置处理:', error);
    } finally {
      if (seq === tenantFetchSeq) {
        tenantIsLoaded.value = true;
        tenantLoading.value = false;
      }
    }
  };

  /**
   * 按「租户 → 平台 → 前端 env 默认」解析品牌并强制写入偏好设置与 DOM。
   *
   * 配置为空时 tenantConfig / platformConfig 都是空对象，因此必然回退到
   * VITE_APP_TITLE / 默认 Logo / /favicon.ico，不会保留上一个租户的品牌。
   */
  const applyBrandPreferences = async () => {
    const initial = getInitialPreferences();
    const defaultTitle = initial.app?.name || '';
    const defaultLogo = initial.logo?.source || DEFAULT_LOGO;
    const defaultLogoDark = initial.logo?.sourceDark || defaultLogo;

    const tenant = tenantConfig.value;
    const platform = platformConfig.value;
    const title = tenant.title || platform.title || defaultTitle;

    // Logo 与 favicon 可能来自不同层级，签名预取必须用提供该值的配置本身
    const logoProvider = tenant.logo ? tenant : platform.logo ? platform : null;
    const faviconProvider = tenant.favicon
      ? tenant
      : platform.favicon
        ? platform
        : null;

    try {
      if (logoProvider) {
        await prefetchSignedUrls([logoProvider.logo], logoProvider);
      }
      if (faviconProvider && faviconProvider !== logoProvider) {
        await prefetchSignedUrls([faviconProvider.favicon], faviconProvider);
      }
    } catch (error) {
      console.warn('换取品牌资源签名地址失败，回退普通地址:', error);
    }

    const logoUrl = logoProvider?.logo
      ? buildStaticUrl(
          logoProvider.logo,
          logoProvider.static_url,
          true,
          logoProvider,
        )
      : defaultLogo;
    // 未单独配置 favicon 时沿用动态 Logo：侧边栏与浏览器标签图标保持一致；
    // 连 Logo 也没有动态值才回退到前端内置的 /favicon.ico
    const faviconUrl = faviconProvider?.favicon
      ? buildStaticUrl(
          faviconProvider.favicon,
          faviconProvider.static_url,
          true,
          faviconProvider,
        )
      : logoProvider?.logo
        ? logoUrl
        : DEFAULT_FAVICON;

    // updatePreferences 用 defu 合并，缓存里的旧租户值会盖掉新值；必须强制覆盖
    setPreferences({
      app: { name: title },
      logo: {
        source: logoUrl,
        sourceDark: logoProvider?.logo ? logoUrl : defaultLogoDark,
      },
    });

    document.title = title;
    const faviconLink =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (faviconLink) faviconLink.href = faviconUrl;
  };

  /**
   * 清空租户配置（退出登录时调用）
   * 不影响 platformConfig（登录页复用平台品牌），但品牌显示要立即回退
   */
  const clearTenantConfig = () => {
    tenantConfig.value = {};
    tenantLoading.value = false;
    tenantError.value = null;
    tenantIsLoaded.value = false;
    void applyBrandPreferences().catch((error) => {
      console.warn('恢复默认品牌失败:', error);
    });
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
    void applyBrandPreferences().catch((error) => {
      console.warn('恢复默认品牌失败:', error);
    });
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

    try {
      // 即使配置为空也要应用一次：旧租户的品牌必须被 env 兜底值覆盖
      await applyBrandPreferences();
    } catch (error) {
      console.warn('应用站点品牌配置失败:', error);
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
