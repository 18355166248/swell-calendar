import { describe, expect, it } from 'vitest';

import { createCalendarStore } from '@/contexts/calendarStore';

describe('hover slice', () => {
  it('初始 hoveredEventId 为 null', () => {
    const store = createCalendarStore();
    expect(store.getState().hover.hoveredEventId).toBeNull();
  });

  it('setHoveredEventId 设置与清除当前悬浮事件 id', () => {
    const store = createCalendarStore();

    store.getState().hover.setHoveredEventId('evt-1');
    expect(store.getState().hover.hoveredEventId).toBe('evt-1');

    store.getState().hover.setHoveredEventId(null);
    expect(store.getState().hover.hoveredEventId).toBeNull();
  });

  it('切换悬浮事件时覆盖前一个 id（跨天多段以 id 联动，非叠加）', () => {
    const store = createCalendarStore();

    store.getState().hover.setHoveredEventId('evt-1');
    store.getState().hover.setHoveredEventId('evt-2');
    expect(store.getState().hover.hoveredEventId).toBe('evt-2');
  });
});
