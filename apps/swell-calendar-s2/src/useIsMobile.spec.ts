import { afterEach, describe, expect, it, vi } from 'vitest';

import { detectMobileShell } from './useIsMobile';

function mockMatchMedia(matchesByQuery: Record<string, boolean>) {
  vi.stubGlobal('window', {
    matchMedia: vi.fn((query: string) => ({
      matches: matchesByQuery[query] ?? false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('detectMobileShell', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('小屏 viewport 切到移动端外壳', () => {
    mockMatchMedia({
      '(max-width: 767px)': true,
    });

    expect(detectMobileShell()).toBe(true);
  });

  it('平板/桌面宽度不使用移动端外壳', () => {
    mockMatchMedia({
      '(max-width: 767px)': false,
    });

    expect(detectMobileShell()).toBe(false);
  });
});
