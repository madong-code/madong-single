<script lang="ts" setup>
import type { VbenFormSchema } from '#/core/ui/common';

import { computed, markRaw, onMounted, ref } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '#/core/ui/common';
import { $t } from '#/core/locales';

import { getTenantModeFlagApi } from '#/api';
import { useAppConfig } from '#/core/composables';
import TenantSearcher from '#/components/tenant-searcher/index.vue';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

/** 租户模式开关 */
const tenantEnabled = ref(false);
const tenantAutoFirst = ref(false);

const { tenantMode } = useAppConfig(import.meta.env, import.meta.env.PROD);

/** 获取租户模式状态 */
async function fetchTenantMode() {
  // 强制模式：直接决定开关，完全不请求 /auth/tenant-mode
  if (tenantMode === 'standard') {
    tenantEnabled.value = false;
    return;
  }
  if (tenantMode === 'saas') {
    tenantEnabled.value = true;
    tenantAutoFirst.value = true;
    return;
  }
  // auto（默认）：探测后端，标准后端 404 静默失败 → 保持关闭
  const modeData = await getTenantModeFlagApi();
  tenantEnabled.value = modeData.enabled ?? false;
  tenantAutoFirst.value = modeData.auto_select_first ?? false;
}

onMounted(() => {
  fetchTenantMode();
});

/** 表单提交处理：租户字段统一提交 tenant_code */
function handleLogin(values: Record<string, any>) {
  const params = { ...values };
  // 非租户模式或未填写时不传租户标识
  if (!tenantEnabled.value || !params.tenant_code) {
    delete params.tenant_code;
  }
  authStore.authLogin(params);
}

const formSchema = computed((): VbenFormSchema[] => {
  const schemas: VbenFormSchema[] = [];

  if (tenantEnabled.value) {
    schemas.push({
      component: markRaw(TenantSearcher),
      componentProps: {
        autoFirst: tenantAutoFirst.value,
        placeholder: '输入租户代码或名称搜索',
      },
      fieldName: 'tenant_code',
      label: '租户',
      // defaultValue 必须给空串：值为 undefined 时 zod 会先报内置的
      // 「Required」英文提示，而不是下面的中文文案
      defaultValue: '',
      rules: z
        .string({ required_error: '请输入租户代码' })
        .min(1, { message: '请输入租户代码' })
        .regex(/^[\w-]{1,64}$/, { message: '租户代码格式不正确' }),
    });
  }

  schemas.push(
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'user_name',
      label: $t('authentication.username'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      fieldName: 'captcha',
      rules: z.boolean().refine((value) => value, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  );

  return schemas;
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleLogin"
  />
</template>
