import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CalendarStoreProvider, createCalendarStore } from '@/contexts/calendarStore';
import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { DragTimeTooltip } from './DragTimeTooltip';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function makeUIModel() {
  return new EventUIModel(
    new EventModel({
      id: 'e1',
      title: 'A',
      category: 'time',
      start: new Date('2026-06-08T09:00:00'),
      end: new Date('2026-06-08T10:00:00'),
    })
  );
}

describe('DragTimeTooltip', () => {
  let container: HTMLDivElement;
  let root: Root;
  let store: ReturnType<typeof createCalendarStore>;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    // createCalendarStore 默认 currentView = 'week'（非 scheduler）
    store = createCalendarStore();
    // 模拟拖拽进行中：设置光标坐标，使 dnd.x/y 非空
    act(() => {
      store.getState().dnd.initDrag({
        draggingItemType: 'event/timeGrid/move/e1',
        initX: 100,
        initY: 100,
      });
      store.getState().dnd.setDragging({ x: 120, y: 140 });
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  const renderTooltip = (start: DayjsTZDate | null, end: DayjsTZDate | null) =>
    act(() => {
      root.render(
        <CalendarStoreProvider store={store}>
          <DragTimeTooltip uiModel={makeUIModel()} start={start} end={end} />
        </CalendarStoreProvider>
      );
    });

  it('在 week 视图（非 scheduler）拖拽时也显示时间范围（HH:mm - HH:mm）', () => {
    renderTooltip(new DayjsTZDate('2026-06-08T09:30:00'), new DayjsTZDate('2026-06-08T10:45:00'));

    const tip = container.querySelector('[class*="drag-time-tooltip"]');
    expect(tip).not.toBeNull();
    expect(tip?.textContent).toContain('09:30 - 10:45');
  });

  it('start/end 缺失时不渲染', () => {
    renderTooltip(null, null);
    expect(container.querySelector('[class*="drag-time-tooltip"]')).toBeNull();
  });

  it('拖拽未开始（dnd.x/y 为空）时不渲染', () => {
    act(() => {
      store.getState().dnd.reset();
    });
    renderTooltip(new DayjsTZDate('2026-06-08T09:30:00'), new DayjsTZDate('2026-06-08T10:45:00'));
    expect(container.querySelector('[class*="drag-time-tooltip"]')).toBeNull();
  });
});
