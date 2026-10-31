<script setup lang="ts">
import type { CrudApiInstance } from '#/adapter/crud';

import { ElMessage, ElMessageBox } from 'element-plus';

import { useCrud } from '#/adapter/crud';
import { MemberService } from '#/api/member';
import { Page } from '#/components/page';
import { $t } from '#/locales';

import { useCrudSchema } from './schemas';

/**
 * 重置会员密码
 *
 * 密码规则与后端 MemberValidate::sceneResetPassword 保持一致（6-20 位）
 */
async function handleResetPassword(
  crudApi: CrudApiInstance,
  row: Record<string, any>,
): Promise<void> {
  try {
    const { value } = await ElMessageBox.prompt(
      $t('member.user.reset_password.content', [row?.username ?? '']),
      $t('member.user.reset_password.title'),
      {
        type: 'warning',
        inputType: 'password',
        inputPlaceholder: $t('member.user.reset_password.placeholder'),
        confirmButtonText: $t('common.confirm'),
        cancelButtonText: $t('common.cancel'),
        inputValidator: (val: string) => {
          if (!val) {
            return $t('member.user.reset_password.required');
          }
          if (val.length < 6 || val.length > 20) {
            return $t('member.user.reset_password.length');
          }
          return true;
        },
      },
    );
    if (!value) {
      return;
    }
    await MemberService.resetPassword(row.id, { password: value });
    ElMessage.success($t('member.user.reset_password.success'));
    crudApi.refreshUpdate();
  } catch {
    // 用户取消输入
  }
}

const [BasicCrud, crudApi] = useCrud({
  ...useCrudSchema(),
  // 操作栏「更多」下拉：默认含「删除」，此处追加「重置密码」
  dropDownActions: [
    {
      key: 'resetPassword',
      label: $t('member.user.reset_password.title'),
      icon: 'ant-design:lock-outlined',
      // 排序小于默认按钮（1000），显示在「删除」之前
      sort: 900,
      auth: 'member:user:reset_password',
      onClick: (_e: any, row: any) => {
        void handleResetPassword(crudApi, row);
      },
    },
  ],
});
</script>
<template>
  <Page auto-content-height>
    <BasicCrud />
  </Page>
</template>
