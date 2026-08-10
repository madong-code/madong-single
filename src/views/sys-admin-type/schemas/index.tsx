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
import { SysAdminTypeService } from '#/api/sys-admin-type';
import { $t } from '#/locales';

export const useCrudSchema = (): CrudSchema => {
  return {
    crudApi: {
      list: SysAdminTypeService.list,
      add: SysAdminTypeService.create,
      edit: SysAdminTypeService.update,
      remove: SysAdminTypeService.delete,
      batchRemove: SysAdminTypeService.remove,
      view: SysAdminTypeService.get,
    },
    columns: [
      { type: 'checkbox', width: 60 },
      {prop: "code", label: $t('sys-admin-type.table.columns.code')},
      {prop: "name", label: $t('sys-admin-type.table.columns.name')},
      {prop: "id", label: $t('sys-admin-type.table.columns.id')},
      {prop: "sort", label: $t('sys-admin-type.table.columns.sort')}
    ],
    searchForm: {
      enabled: true,
      schema: [

      ],
    },
    formDialog: {
      enabled: true,
      schema: [
        {label: $t('sys-admin-type.form.code'), prop: "code", component: "input", colSpan: 24},
        {label: $t('sys-admin-type.form.name'), prop: "name", component: "input", colSpan: 24},
        {label: $t('sys-admin-type.form.id'), prop: "id", component: "input", colSpan: 24, show: false},
        {label: $t('sys-admin-type.form.sort'), prop: "sort", component: "input", colSpan: 24}
      ],
    },
  };
};
