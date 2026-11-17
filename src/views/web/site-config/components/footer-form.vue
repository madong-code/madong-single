<script setup lang="ts">
/**
 * Tab2：页脚信息（备案信息 + 页脚入口）
 * schema 数组定义（useVbenForm），自带加载与保存；切换 Tab 时随 v-if 销毁。
 */
import { onMounted, ref } from 'vue';

import { ElButton, ElMessage } from 'element-plus';

import type { WebSiteConfig } from '#/api/web/site';

import { WebSiteService } from '#/api/web/site';
import { useVbenForm } from '#/adapter/form';
import { DictEnum } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'WebSiteFooterForm' });

const saving = ref(false);

const FIELD_ITEM = 'col-span-2 w-1/2';
const DIVIDER_ITEM = 'col-span-2 w-full';

const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  commonConfig: { labelWidth: 130 },
  wrapperClass: 'grid-cols-2',
  schema: [
    {
      fieldName: '_record',
      label: '',
      component: 'Divider',
      hideLabel: true,
      formItemClass: DIVIDER_ITEM,
      componentProps: { title: $t('web.site.group_record') },
    },
    {
      fieldName: 'site_record_no',
      label: $t('web.site.fields.site_record_no'),
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: $t('web.site.placeholder.site_record_no'),
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: 'site_icp_url',
      label: $t('web.site.fields.site_icp_url'),
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: $t('web.site.placeholder.site_icp_url'),
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: 'site_network_security',
      label: $t('web.site.fields.site_network_security'),
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: $t('web.site.placeholder.site_network_security'),
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: 'site_network_security_url',
      label: $t('web.site.fields.site_network_security_url'),
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: $t('web.site.placeholder.site_network_security_url'),
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: 'site_copyright',
      label: $t('web.site.fields.site_copyright'),
      component: 'Textarea',
      componentProps: {
        rows: 2,
        maxlength: 255,
        showWordLimit: true,
        placeholder: $t('web.site.placeholder.site_copyright'),
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: '_entry',
      label: '',
      component: 'Divider',
      hideLabel: true,
      formItemClass: DIVIDER_ITEM,
      componentProps: { title: $t('web.site.group_entry') },
    },
    {
      fieldName: 'show_apply',
      label: $t('web.site.fields.show_apply'),
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
      fieldName: 'show_powered',
      label: $t('web.site.fields.show_powered'),
      component: 'ApiDict',
      defaultValue: 1,
      componentProps: {
        renderType: 'RadioGroup',
        isBtn: true,
        code: DictEnum.SYS_ENABLED_STATUS,
      },
      formItemClass: FIELD_ITEM,
    },
  ],
});

function applyConfig(cfg: WebSiteConfig) {
  formApi.setValues({
    site_record_no: cfg.site_record_no,
    site_icp_url: cfg.site_icp_url,
    site_network_security: cfg.site_network_security,
    site_network_security_url: cfg.site_network_security_url,
    site_copyright: cfg.site_copyright,
    // 表单值为字典 1/0（按钮组），后端返回 boolean 需转换
    show_apply: cfg.show_apply ? 1 : 0,
    show_powered: cfg.show_powered ? 1 : 0,
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
      site_record_no: values.site_record_no || '',
      site_icp_url: values.site_icp_url || '',
      site_network_security: values.site_network_security || '',
      site_network_security_url: values.site_network_security_url || '',
      site_copyright: values.site_copyright || '',
      show_apply: !!values.show_apply,
      show_powered: !!values.show_powered,
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
