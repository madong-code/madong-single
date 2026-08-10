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

export interface SysAdminTypeRow {
  id: number | string;
  /** 类型编码: platform-平台管理员 */
  code: string;
  /** 创建时间 */
  created_at: number;
  /** 类型名称 */
  name: string;
  /** 更新时间 */
  updated_at: number;
  /** 排序 */
  sort: number;
}
