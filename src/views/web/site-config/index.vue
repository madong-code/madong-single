<script setup lang="ts">
/**
 * 站点设置（web 前台门户）：前台开关 / 站点地址 / 站点信息 / 页脚信息（版权、备案、入口开关）/ 百度统计。
 *
 * 与 ERP 后台管理系统自身的站点信息分离存储：site_setting（系统配置→站点设置） vs web_site_setting（本页）。
 * 多租户差异：后端 sys_config 走 TenantScope，各租户各存一份，请求头 X-Tenant-Id 由 requestClient
 * 拦截器统一注入，本页无需感知租户；保存为白名单 merge，不影响同行的 membership_enabled（portal 插件独占写）。
 * 后端 SiteConfigController（GET|POST /web/site-config，权限 web:site:read|update）。
 *
 * 结构沿用 system/config/index.vue 的数组定义模式：settingList 定义 Tab，
 * 每个 Tab 是独立表单组件（useVbenForm schema 数组），v-if 仅挂载当前 Tab，切换即销毁。
 */
import { ref } from 'vue';

import { ElIcon, ElTabPane, ElTabs } from 'element-plus';
import { ChartColumn, FileText, Settings } from 'lucide-vue-next';

import FooterForm from './components/footer-form.vue';
import SiteForm from './components/site-form.vue';
import TongjiForm from './components/tongji-form.vue';
import { Page } from '#/components/page';
import { $t } from '#/locales';

defineOptions({ name: 'WebSiteConfig' });

const activeTab = ref('site');

const settingList = [
  {
    component: SiteForm,
    icon: Settings,
    key: 'site',
    name: $t('web.site.tabs.site'),
  },
  {
    component: FooterForm,
    icon: FileText,
    key: 'footer',
    name: $t('web.site.tabs.footer'),
  },
  {
    component: TongjiForm,
    icon: ChartColumn,
    key: 'tongji',
    name: $t('web.site.tabs.tongji'),
  },
];
</script>

<template>
  <Page auto-content-height content-class="bg-card p-7">
    <!-- content-class：整页统一底色（浅色主题为白底、暗色主题为卡片色）+ 统一内边距。
         注意：template 根节点前禁止放置任何注释——DEV 模式注释会被保留为节点，导致组件变成
         多根（Fragment 根），破坏布局 Transition mode="out-in" 的 afterLeave 钩子链，
         引起其他标签页白屏（仅 DEV 复现，生产构建会剥离注释） -->
    <div v-loading="false" class="site-config flex h-full min-h-0 flex-col">
      <ElTabs v-model="activeTab" class="site-config__tabs">
        <ElTabPane v-for="item in settingList" :key="item.key" :name="item.key">
          <template #label>
            <span class="tab-label">
              <ElIcon><component :is="item.icon" /></ElIcon>
              {{ item.name }}
            </span>
          </template>
          <!-- v-if：仅挂载当前 Tab，切换即销毁上一个表单实例 -->
          <component :is="item.component" v-if="activeTab === item.key" />
        </ElTabPane>
      </ElTabs>
    </div>
  </Page>
</template>

<style scoped>
.site-config__tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.site-config__tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

/* 去掉 Tab 底部横线，对齐模块市场分类标签 */
.site-config__tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.site-config__tabs :deep(.el-tabs__item) {
  font-weight: 500;
}

.site-config__tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}
</style>
