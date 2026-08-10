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
      { prop: 'code', label: $t('sys-admin-type.table.columns.code') },
      { prop: 'name', label: $t('sys-admin-type.table.columns.name') },
      { prop: 'id', label: $t('sys-admin-type.table.columns.id') },
      { prop: 'sort', label: $t('sys-admin-type.table.columns.sort') },
    ],
    searchForm: {
      enabled: true,
      schema: [],
    },
    formDialog: {
      enabled: true,
      schema: [
        {
          label: $t('sys-admin-type.form.code'),
          fieldName: 'code',
          component: 'input',
        },
        {
          label: $t('sys-admin-type.form.name'),
          fieldName: 'name',
          component: 'input',
        },
        {
          label: $t('sys-admin-type.form.id'),
          fieldName: 'id',
          component: 'input',
          hide: true,
        },
        {
          label: $t('sys-admin-type.form.sort'),
          fieldName: 'sort',
          component: 'input',
        },
      ],
    },
  };
};
