/**
 * 查看器格式化工具多场景兼容性测试。
 * 覆盖：常规数据、空数据、异常格式数据、缺失字段、大数据量五类场景。
 */
import { describe, expect, it } from 'vitest';

import {
  formatAmountValue,
  formatDateValue,
  formatEnumValue,
  formatTextValue,
  formatViewerValue,
  isEmptyValue,
  normalizeListValue,
  safeJsonStringify,
} from '../format';

describe('isEmptyValue 空值判定', () => {
  it.each([
    [null, true],
    [undefined, true],
    ['', true],
    ['   ', true],
    [[], true],
    [0, false],
    [false, false],
    ['0', false],
    [[0], false],
    [{ a: 1 }, false],
  ])('isEmptyValue(%j) → %j', (input, expected) => {
    expect(isEmptyValue(input)).toBe(expected);
  });
});

describe('formatDateValue 日期格式化', () => {
  it('常规：ISO 字符串', () => {
    expect(formatDateValue('2026-11-11T10:00:00Z')).toMatch(/^2026-11-11/);
  });

  it('常规：毫秒时间戳（数字与字符串）', () => {
    const ts = new Date('2026-01-02T00:00:00Z').getTime();
    expect(formatDateValue(ts)).toContain('2026-01-02');
    expect(formatDateValue(String(ts))).toContain('2026-01-02');
  });

  it('自适配：秒级时间戳自动转毫秒', () => {
    const sec = Math.floor(new Date('2026-01-02T00:00:00Z').getTime() / 1000);
    expect(formatDateValue(sec)).toContain('2026-01-02');
    expect(formatDateValue(String(sec))).toContain('2026-01-02');
  });

  it('自定义格式', () => {
    const ts = new Date('2026-01-02T03:04:05Z').getTime();
    expect(formatDateValue(ts, { format: 'YYYY/MM/DD' })).toBe('2026/01/02');
  });

  it('空数据兜底', () => {
    for (const v of [null, undefined, '', '   ']) {
      expect(formatDateValue(v)).toBe('--');
    }
  });

  it('异常格式数据：非法日期串回退 --，不输出 Invalid Date', () => {
    expect(formatDateValue('not-a-date')).toBe('--');
    expect(formatDateValue({})).toBe('--');
    expect(formatDateValue(true)).toBe('--');
    expect(formatDateValue('2026-13-45')).toBe('--');
  });
});

describe('formatAmountValue 金额格式化', () => {
  it('常规：千分位 + 两位精度', () => {
    expect(formatAmountValue(1234567.891)).toBe('1,234,567.89');
    expect(formatAmountValue(-9876543.21)).toBe('-9,876,543.21');
  });

  it('前后缀单位', () => {
    expect(
      formatAmountValue(1234.5, { prefix: '¥', suffix: ' 元' }),
    ).toBe('¥1,234.50 元');
  });

  it('关闭千分位与整数精度', () => {
    expect(formatAmountValue(1234567, { precision: 0, separator: false })).toBe(
      '1234567',
    );
  });

  it('空数据兜底', () => {
    for (const v of [null, undefined, '', []]) {
      expect(formatAmountValue(v)).toBe('--');
    }
  });

  it('异常格式：非数值串原样展示不改写', () => {
    expect(formatAmountValue('abc')).toBe('abc');
    expect(formatAmountValue(NaN)).toBe('--');
    expect(formatAmountValue(Infinity)).toBe('--');
  });

  it('字符串数值正常转换', () => {
    expect(formatAmountValue('1234.567')).toBe('1,234.57');
  });
});

describe('formatEnumValue 枚举映射', () => {
  const options = [
    { color: 'success' as const, label: '启用', value: 1 },
    { color: 'danger' as const, label: '禁用', value: 0 },
  ];

  it('常规：数组配置命中（数字与字符串值均可）', () => {
    expect(formatEnumValue(1, options)).toEqual({
      color: 'success',
      label: '启用',
      matched: true,
    });
    expect(formatEnumValue('0', options)).toEqual({
      color: 'danger',
      label: '禁用',
      matched: true,
    });
  });

  it('常规：键值对象配置', () => {
    expect(formatEnumValue('1', { '1': '男', '2': '女' })).toEqual({
      label: '男',
      matched: true,
    });
  });

  it('未命中回退原值', () => {
    expect(formatEnumValue(99, options)).toEqual({
      label: '99',
      matched: false,
    });
  });

  it('空数据兜底', () => {
    expect(formatEnumValue(null, options)).toEqual({
      label: '--',
      matched: false,
    });
    expect(formatEnumValue(undefined, {})).toEqual({
      label: '--',
      matched: false,
    });
  });
});

describe('formatTextValue 长文本', () => {
  it('常规文本', () => {
    expect(formatTextValue('hello')).toBe('hello');
  });

  it('长文本截断（大数据量）', () => {
    const long = 'a'.repeat(10_000);
    const out = formatTextValue(long, 50);
    expect(out.length).toBe(53); // 50 + '...'
    expect(out.endsWith('...')).toBe(true);
  });

  it('limit=0 不截断', () => {
    const long = 'b'.repeat(5_000);
    expect(formatTextValue(long, 0)).toBe(long);
  });

  it('空数据与异常对象兜底', () => {
    expect(formatTextValue(null)).toBe('--');
    expect(formatTextValue(undefined)).toBe('--');
    expect(formatTextValue({ x: 1 })).toBe('{\n  "x": 1\n}');
  });
});

describe('normalizeListValue 列表归一', () => {
  it('数组（含混合类型）', () => {
    expect(normalizeListValue([1, 'a', true])).toEqual(['1', 'a', 'true']);
  });

  it('逗号分隔串（自动去空白）', () => {
    expect(normalizeListValue(' 1, 2 ,3 ')).toEqual(['1', '2', '3']);
  });

  it('空数据', () => {
    expect(normalizeListValue(null)).toEqual([]);
    expect(normalizeListValue('')).toEqual([]);
    expect(normalizeListValue([])).toEqual([]);
  });

  it('大数据量：雪花 id 长列表', () => {
    const ids = Array.from({ length: 5_000 }, (_, i) => `${379000000000000000 + i}`);
    const out = normalizeListValue(ids.join(','));
    expect(out.length).toBe(5_000);
  });
});

describe('safeJsonStringify 安全序列化', () => {
  it('常规对象', () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it('循环引用不抛错', () => {
    const obj: any = { self: null };
    obj.self = obj;
    expect(safeJsonStringify(obj)).toContain('[Circular]');
  });

  it('BigInt 不抛错', () => {
    expect(safeJsonStringify({ id: 123n })).toContain('123');
  });
});

describe('formatViewerValue 统一分发', () => {
  it('text：数组自动拼接（缺失字段兜底 --）', () => {
    expect(formatViewerValue([1, 2], { format: 'text' })).toBe('1, 2');
    expect(formatViewerValue(null, { format: 'text' })).toBe('--');
    expect(formatViewerValue(undefined, {})).toBe('--');
  });

  it('text：对象自动 JSON', () => {
    expect(formatViewerValue({ k: 'v' }, { format: 'text' })).toContain('"k"');
  });

  it('date/datetime/amount/enum 分发正确', () => {
    const ts = new Date('2026-01-02T00:00:00Z').getTime();
    expect(formatViewerValue(ts, { format: 'date' })).toContain('2026-01-02');
    expect(formatViewerValue(1234.5, { format: 'amount' })).toBe('1,234.50');
    expect(
      formatViewerValue(1, {
        enum: [{ label: '启用', value: 1 }],
        format: 'enum',
      }),
    ).toBe('启用');
  });

  it('schema.format 为字符串时兜底', () => {
    expect(formatViewerValue(1234.5, { format: 'amount' })).toBe('1,234.50');
  });

  it('未知 format 类型按 text 处理', () => {
    expect(formatViewerValue('abc', { format: 'unknown' as any })).toBe('abc');
  });
});
