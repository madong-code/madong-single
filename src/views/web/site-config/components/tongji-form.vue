<script setup lang="ts">
/**
 * Tab3：百度统计（统计开关 + 统计 Key）
 * schema 数组定义（useVbenForm），自带加载与保存；切换 Tab 时随 v-if 销毁。
 */
import { onMounted, ref } from 'vue';

import { ElButton, ElMessage } from 'element-plus';

import type { WebSiteConfig } from '#/api/web/site';

import { WebSiteService } from '#/api/web/site';
import { useVbenForm } from '#/adapter/form';
import { DictEnum } from '#/enums';
import { $t } from '#/locales';

defineOptions({ name: 'WebSiteTongjiForm' });

const saving = ref(false);

const FIELD_ITEM = 'col-span-2 w-1/2';
const DIVIDER_ITEM = 'col-span-2 w-full';

const [Form, formApi] = useVbenForm({
  showDefaultActions: false,
  commonConfig: { labelWidth: 130 },
  wrapperClass: 'grid-cols-2',
  schema: [
    {
      fieldName: '_tongji',
      label: '',
      component: 'Divider',
      hideLabel: true,
      formItemClass: DIVIDER_ITEM,
      componentProps: { title: $t('web.site.group_tongji') },
    },
    {
      fieldName: 'tongji_enabled',
      label: $t('web.site.fields.tongji_enabled'),
      component: 'ApiDict',
      defaultValue: 0,
      componentProps: {
        renderType: 'RadioGroup',
        isBtn: true,
        code: DictEnum.SYS_ENABLED_STATUS,
      },
      formItemClass: FIELD_ITEM,
    },
    {
      fieldName: 'tongji_key',
      label: $t('web.site.fields.tongji_key'),
      component: 'Input',
      componentProps: {
        maxlength: 64,
        clearable: true,
        placeholder: $t('web.site.placeholder.tongji_key'),
      },
      help: $t('web.site.placeholder.tongji_help'),
      formItemClass: FIELD_ITEM,
    },
  ],
});

function applyConfig(cfg: WebSiteConfig) {
  formApi.setValues({
    // 表单值为字典 1/0（按钮组），后端返回 boolean 需转换
    tongji_enabled: cfg.tongji_enabled ? 1 : 0,
    tongji_key: cfg.tongji_key,
  });
}

async function loadConfig() {
  applyConfig(await WebSiteService.getConfig());
}

async function save() {
  const values = (await formApi.getValues()) as WebSiteConfig;

  // 后端约定：Key 为空时开关强制关闭；这里提前拦截，避免「保存成功但开关被重置」的困惑
  if (values.tongji_enabled && !values.tongji_key) {
    ElMessage.warning($t('web.site.messages.tongji_key_required'));
    return;
  }

  saving.value = true;
  try {
    const data = await WebSiteService.saveConfig({
      tongji_enabled: !!values.tongji_enabled,
      tongji_key: values.tongji_key || '',
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
