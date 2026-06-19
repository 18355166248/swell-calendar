import { describe, expect, it } from 'vitest';

import { classifyStorybookEntry, storybookStorySortOrder, storybookTheme } from './showcase';

describe('storybook showcase config', () => {
  it('classifies overview as branded docs entry', () => {
    expect(classifyStorybookEntry('Swell Calendar/概览', '概览')).toMatchObject({
      stageVariant: 'docs',
      audienceLabel: 'Brand Showcase',
      badgeLabel: '品牌首页',
      categoryTrail: '概览',
    });
  });

  it('classifies regression stories as internal qa scenes', () => {
    expect(classifyStorybookEntry('日历/调度器/回归测试', '真实指针回归')).toMatchObject({
      stageVariant: 'calendar',
      audienceLabel: 'Internal QA',
      badgeLabel: '回归场景',
      sectionLabel: '调度器',
    });
  });

  it('keeps overview, views, scheduler, and regression ordered for the sidebar', () => {
    expect(storybookStorySortOrder).toEqual([
      'Swell Calendar',
      ['概览'],
      '日历',
      [
        '视图',
        ['日视图', '周视图', '月视图', '时间线'],
        '调度器',
        ['基础', '交互', '高级能力', '回归测试'],
        '应用示例',
      ],
    ]);
  });

  it('uses a warm premium theme instead of the old violet-heavy palette', () => {
    expect(storybookTheme.colorPrimary).toBe('#c96f3b');
    expect(storybookTheme.appBg).toBe('#f3ede2');
    expect(storybookTheme.fontDisplay).toContain('Baskerville');
  });
});
