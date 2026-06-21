import { describe, expect, it } from 'vitest';

import { DESKTOP_MIN_WIDTH, TABLET_MIN_WIDTH } from '@/constants/viewport.const';

import { getTierClassName, getViewportTier } from './viewport';

describe('getViewportTier', () => {
  it('窄于平板下界判为 mobile', () => {
    expect(getViewportTier(0)).toBe('mobile');
    expect(getViewportTier(375)).toBe('mobile');
    expect(getViewportTier(TABLET_MIN_WIDTH - 1)).toBe('mobile');
  });

  it('落在平板区间判为 tablet（下界包含、上界排除）', () => {
    expect(getViewportTier(TABLET_MIN_WIDTH)).toBe('tablet');
    expect(getViewportTier(820)).toBe('tablet');
    expect(getViewportTier(DESKTOP_MIN_WIDTH - 1)).toBe('tablet');
  });

  it('达到桌面下界判为 desktop', () => {
    expect(getViewportTier(DESKTOP_MIN_WIDTH)).toBe('desktop');
    expect(getViewportTier(1280)).toBe('desktop');
  });

  it('非法宽度按最窄档 mobile 兜底', () => {
    expect(getViewportTier(Number.NaN)).toBe('mobile');
    expect(getViewportTier(-100)).toBe('mobile');
    expect(getViewportTier(Number.POSITIVE_INFINITY)).toBe('mobile');
  });
});

describe('getTierClassName', () => {
  it('桌面档仅返回基类（零回归）', () => {
    expect(getTierClassName('day-view', 'desktop')).toBe('day-view');
  });

  it('移动 / 平板档追加 BEM 修饰类', () => {
    expect(getTierClassName('day-view', 'mobile')).toBe('day-view day-view--mobile');
    expect(getTierClassName('month', 'tablet')).toBe('month month--tablet');
  });
});
