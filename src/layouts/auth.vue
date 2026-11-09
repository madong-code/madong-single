<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { AuthPageLayout } from '#/core/layouts';
import { preferences } from '#/core/preferences';
import { $t } from '#/locales';
import { useSiteConfigStore } from '#/store/modules/site-config';
import { buildStaticUrl } from '#/utils/url';
import {
  isPrivateResourcePending,
  resolveSignedUrl,
} from '#/utils/url/private-storage';

const siteConfigStore = useSiteConfigStore();

const appName = computed(
  () => siteConfigStore.platformConfig.title || preferences.app.name,
);

/** 站点配置里的 Logo 原始资源 key（私有空间下不能直接拼域名访问） */
const rawLogo = computed(() =>
  String(siteConfigStore.platformConfig.logo || '').trim(),
);

/**
 * 私有空间的签名直链是否尚未就绪。
 *
 * 这里主动调一次 resolveSignedUrl 触发批量换取：pending 时下游不会走到
 * buildStaticUrl，若不在此触发，签名地址永远不会被请求（内部已有缓存、
 * 节流与去重，bootstrap 预热过则直接命中缓存，不产生额外请求）。
 */
const logoPending = computed(() => {
  if (rawLogo.value === '') return false;
  resolveSignedUrl(rawLogo.value);
  return isPrivateResourcePending(rawLogo.value);
});

/**
 * Logo 可访问地址：
 * - null：站点未配置 Logo，交由调用方回退默认品牌图
 * - ''：私有空间签名未就绪，仅保留应用名占位，避免裸链破图与无效请求
 * - 其它：经 buildStaticUrl 解析（私有签名直链 / CDN 域名 / 同域相对路径）
 */
const resolvedLogo = computed<null | string>(() => {
  const raw = rawLogo.value;
  if (raw === '') return null;
  if (logoPending.value) return '';
  return buildStaticUrl(raw);
});

// 明暗主题共用同一份解析结果，暗色主题不会再漏掉私有空间签名处理
const logo = computed(() => resolvedLogo.value ?? preferences.logo.source);
const logoDark = computed(
  () =>
    resolvedLogo.value ??
    preferences.logo.sourceDark ??
    preferences.logo.source,
);

// 登录页加载时确保站点配置就绪（退出登录后需要重新拉取品牌信息）
// fetchSiteConfig 内部已做「已加载则跳过」判断，重复调用安全
onMounted(() => {
  siteConfigStore.fetchSiteConfig();
});
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :logo-dark="logoDark"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
