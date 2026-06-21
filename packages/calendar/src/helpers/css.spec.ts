import { describe, expect, it } from 'vitest';

import { CSS_PREFIX } from '@/constants/style.const';

import { cls } from './css';

const p = (name: string) => `${CSS_PREFIX}${name}`;

describe('cls', () => {
  it('给每个语义类加上 CSS_PREFIX', () => {
    expect(cls('day-view')).toBe(p('day-view'));
    expect(cls('layout', 'day-view')).toBe(`${p('layout')} ${p('day-view')}`);
  });

  it('单个字符串内的多个空格分隔类各自加前缀（基类 + 修饰类）', () => {
    expect(cls('day-view day-view--mobile')).toBe(`${p('day-view')} ${p('day-view--mobile')}`);
  });

  it('支持 dict 形式按布尔值筛选', () => {
    expect(cls('day-name', { 'day-name--today': true, 'day-name--past': false })).toBe(
      `${p('day-name')} ${p('day-name--today')}`
    );
  });

  it('忽略空值', () => {
    expect(cls('day-view', undefined, null, '')).toBe(p('day-view'));
  });
});
