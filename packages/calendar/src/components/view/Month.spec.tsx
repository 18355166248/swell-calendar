import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Calendar } from '@/components/Calendar';
import { EventObject } from '@/types/events.type';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function createOverflowEvents(): EventObject[] {
  return Array.from({ length: 7 }, (_, index) => ({
    id: `overflow-${index + 1}`,
    calendarId: 'cal-1',
    title: `事件 ${index + 1}`,
    category: 'allday',
    allDay: true,
    start: new Date('2026-06-09T00:00:00'),
    end: new Date('2026-06-09T23:59:59'),
  }));
}

describe('Month view maxEventStack compatibility', () => {
  let container: HTMLDivElement;
  let root: Root;

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

  it('falls back to month.visibleEventCount when maxEventStack is not configured', () => {
    act(() => {
      root.render(
        <Calendar
          events={createOverflowEvents()}
          options={{
            defaultView: 'month',
            initialDate: '2026-06-01',
            month: {
              visibleEventCount: 2,
            },
          }}
        />
      );
    });

    expect(container.textContent).toContain('+5 更多');
  });

  it('prefers month.maxEventStack over visibleEventCount when both are provided', () => {
    act(() => {
      root.render(
        <Calendar
          events={createOverflowEvents()}
          options={{
            defaultView: 'month',
            initialDate: '2026-06-01',
            month: {
              maxEventStack: 1,
              visibleEventCount: 2,
            },
          }}
        />
      );
    });

    expect(container.textContent).toContain('+6 更多');
  });

  it('keeps the month default visibleEventCount at 4 when host does not configure it', () => {
    act(() => {
      root.render(
        <Calendar
          events={createOverflowEvents()}
          options={{
            defaultView: 'month',
            initialDate: '2026-06-01',
          }}
        />
      );
    });

    expect(container.textContent).toContain('+3 更多');
  });
});
