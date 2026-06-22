import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  type CalendarStoreContext,
  CalendarStoreProvider,
  createCalendarStore,
} from '@/contexts/calendarStore';

import Panel from './Panel';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe('Panel', () => {
  let container: HTMLDivElement;
  let root: Root;
  let store: CalendarStoreContext;

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    store = createCalendarStore();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  it('lets fixed panels grow when their intrinsic height increases after a cached height exists', () => {
    act(() => {
      store.getState().layout.updateDayGridRowHeight('allday', 48);
    });

    act(() => {
      root.render(
        <CalendarStoreProvider store={store}>
          <Panel name="allday" initialHeight={72}>
            all-day
          </Panel>
        </CalendarStoreProvider>
      );
    });

    const panel = container.querySelector(
      '.swell-calendar-time-grid-panel'
    ) as HTMLDivElement | null;

    expect(panel).not.toBeNull();
    expect(panel?.style.height).toBe('72px');
    expect(store.getState().layout.weekViewLayout.dayGridRows.allday.height).toBe(72);
  });

  it('keeps using cached remaining height for the last panel', () => {
    act(() => {
      store.getState().layout.setLastPanelType('time');
      store.getState().layout.updateDayGridRowHeight('time', 320);
    });

    act(() => {
      root.render(
        <CalendarStoreProvider store={store}>
          <Panel name="time" initialHeight={72}>
            time grid
          </Panel>
        </CalendarStoreProvider>
      );
    });

    const panel = container.querySelector(
      '.swell-calendar-time-grid-panel'
    ) as HTMLDivElement | null;

    expect(panel).not.toBeNull();
    expect(panel?.style.height).toBe('320px');
    expect(store.getState().layout.weekViewLayout.dayGridRows.time.height).toBe(320);
  });
});
