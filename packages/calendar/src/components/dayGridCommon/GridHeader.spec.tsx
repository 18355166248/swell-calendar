import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CalendarStoreProvider, createCalendarStore } from '@/contexts/calendarStore';
import DayjsTZDate from '@/time/dayjs-tzdate';

import GridHeader from './GridHeader';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe('GridHeader', () => {
  let container: HTMLDivElement;
  let root: Root;
  const store = createCalendarStore();

  beforeEach(() => {
    reactActEnv.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    delete reactActEnv.IS_REACT_ACT_ENVIRONMENT;
  });

  it('reserves a right inset for the time-grid scrollbar so the header aligns with the body grid', () => {
    act(() => {
      root.render(
        <CalendarStoreProvider store={store}>
          <GridHeader
            type="week"
            marginLeft="72px"
            rightInset="14px"
            dayNames={[
              {
                date: 14,
                day: 1,
                dayName: '周一',
                isToday: false,
                renderDate: 'date',
                dateInstance: new DayjsTZDate('2026-06-14T00:00:00'),
              },
            ]}
            rowStyleInfo={[{ width: 100, left: 0 }]}
          />
        </CalendarStoreProvider>
      );
    });

    const containerNode = container.querySelector(
      '.swell-calendar-day-names-container'
    ) as HTMLDivElement | null;

    expect(containerNode).not.toBeNull();
    expect(containerNode?.style.marginLeft).toBe('72px');
    expect(containerNode?.style.marginRight).toBe('14px');
  });
});
