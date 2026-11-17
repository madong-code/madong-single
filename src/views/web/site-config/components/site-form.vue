<script setup lang="ts">
/**
 * Tab1：站点信息（基础信息 + 联系方式）
 * schema 数组定义（useVbenForm），自带加载与保存；切换 Tab 时随 v-if 销毁。
 */
import { onMounted, ref } from 'vue';

import { ElButton, ElMessage } from 'element-plus';

import type { WebSiteConfig } from '#/api/web/site';

import { WebSiteService } from '#/api/web/site';
import { useVbenForm } from '#/adapter/form';
import { DictEnum } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'WebSiteSiteForm' });

const saving = ref(false);

const FIELD_ITEM = 'col-span-2 w-1/2';
const DIVIDER_ITEM = 'col-span-2 w-full';

const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  commonConfig: { labelWidth: 130 },
  wrapperClass: 'grid-cols-2',
  schema: [
    {
      fieldName: '_basic',
      label: '',
      component: 'Divider',
      hideLabel: true,
      formItemClass: DIVIDER_ITEM,
      componentProps: { title: $t('web.site.group_basic') },
    },
    {
      fieldName: 'site_open',
      label: $t('web.site.fields.site_open'),
      component: 'ApiDict',
      defaultValue: 1,
      componentProps: {
        renderType: 'RadioGroup',
        isBtn: true,
        code: DictEnum.SYS_ENABLED_STATUS,
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: 'site_name',
      label: $t('web.site.fields.site_name'),
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: $t('web.site.placeholder.site_name'),
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: 'site_url',
      label: $t('web.site.fields.site_url'),
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: $t('web.site.placeholder.site_url'),
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: 'site_logo',
      label: $t('web.site.fields.site_logo'),
      component: 'Avatar',
      componentProps: {
        accept: 'image/png,image/jpeg,image/svg+xml',
        shape: 'square',
      },
      help: $t('web.site.placeholder.site_logo'),
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: '_contact',
      label: '',
      component: 'Divider',
      hideLabel: true,
      formItemClass: DIVIDER_ITEM,
      componentProps: { title: $t('web.site.group_contact') },
    },
    {
      fieldName: 'contact_email',
      label: $t('web.site.fields.contact_email'),
      component: 'Input',
      componentProps: {
        maxlength: 100,
        clearable: true,
        placeholder: $t('web.site.placeholder.contact_email'),
      },
      help: $t('web.site.placeholder.contact_email_help'),
      formItemClass: FIELD_ITEM,
    },
  ],
});

function applyConfig(cfg: WebSiteConfig) {
  formApi.setValues({
    // 表单值为字典 1/0（按钮组），后端返回 0|1 直接匹配
    site_open: cfg.site_open,
    site_name: cfg.site_name,
    site_url: cfg.site_url,
    site_logo: cfg.site_logo,
    contact_email: cfg.contact_email,
  });
}

async function loadConfig() {
  applyConfig(await WebSiteService.getConfig());
}

async function save() {
  const values = (await formApi.getValues()) as WebSiteConfig;
  saving.value = true;
  try {
    const data = await WebSiteService.saveConfig({
      site_open: values.site_open ? 1 : 0,
      site_name: values.site_name || '',
      site_url: values.site_url || '',
      site_logo: values.site_logo || '',
      contact_email: values.contact_email || '',
    });
    applyConfig(data);
    ElMessage.success($t('web.site.messages.save_success'));
  } finally {
    saving.value = false;
  }
}

onMounted(loadConfig);
</script>

<template>
  <div class="config-form">
    <Form />
    <div class="site-config__footer flex justify-end">
      <ElButton type="primary" :loading="saving" @click="save">
        {{ $t('web.site.actions.save') }}
      </ElButton>
    </div>
  </div>
</template>

<style scoped>
.config-form {
  padding: 4px 0 8px;
}

.site-config__footer {
  padding-top: 12px;
}
</style>
