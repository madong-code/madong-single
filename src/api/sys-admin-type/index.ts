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

import type { SysAdminTypeRow } from './types';

import BaseService from '#/api/core/base';

const baseUrl = '/sys-admin-type/sysadmintype';

export const SysAdminTypeService = {
  ...BaseService<SysAdminTypeRow>({ baseUrl }),
};
