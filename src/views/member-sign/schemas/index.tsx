/**
 *+------------------
 * madong
 *+------------------
 * Copyright (c) https://gitee.com/motion-code  All rights reserved.
 *+------------------
 * Author: Mr. April (405784684@qq.com)
 *+------------------
 * Official Website: https://madong.tech
 */

import type { CrudSchema } from '#/components/crud/components/types';
import { MemberSignService } from '#/api/member-sign';
import { $t } from '#/locales';

export const useCrudSchema = (): CrudSchema => {
  return {
    crudApi: {
      list: MemberSignService.list,
      add: MemberSignService.create,
      edit: MemberSignService.update,
      remove: MemberSignService.delete,
      batchRemove: MemberSignService.remove,
      view: MemberSignService.get,
    },
    columns: [
      { type: 'checkbox', width: 60 },
      {prop: "points", label: $t('member-sign.table.columns.points')},
      {prop: "member_id", label: $t('member-sign.table.columns.member_id')},
      {prop: "device_ip", label: $t('member-sign.table.columns.device_ip')},
      {prop: "id", label: $t('member-sign.table.columns.id')},
      {prop: "sign_date", label: $t('member-sign.table.columns.sign_date')},
      {prop: "device_ua", label: $t('member-sign.table.columns.device_ua')},
      {prop: "continuous_days", label: $t('member-sign.table.columns.continuous_days')}
    ],
    searchForm: {
      enabled: true,
      schema: [

      ],
    },
    formDialog: {
      enabled: true,
      schema: [
        {label: $t('member-sign.form.points'), prop: "points", component: "input", colSpan: 24},
        {label: $t('member-sign.form.member_id'), prop: "member_id", component: "input", colSpan: 24},
        {label: $t('member-sign.form.device_ip'), prop: "device_ip", component: "input", colSpan: 24},
        {label: $t('member-sign.form.id'), prop: "id", component: "input", colSpan: 24, show: false},
        {label: $t('member-sign.form.sign_date'), prop: "sign_date", component: "input", colSpan: 24},
        {label: $t('member-sign.form.device_ua'), prop: "device_ua", component: "input", colSpan: 24},
        {label: $t('member-sign.form.continuous_days'), prop: "continuous_days", component: "input", colSpan: 24}
      ],
    },
  };
};
