import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Calendar } from '@/components/Calendar';

const reactActEnv = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function clickButton(button: HTMLButtonElement | null) {
  expect(button).not.toBeNull();
  act(() => {
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('Toolbar date range text and navigation', () => {
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

  it('shows scheduler.range as the actual visible day window and paginates by that window', () => {
    act(() => {
      root.render(
        <Calendar
          events={[]}
          options={{
            defaultView: 'scheduler',
            initialDate: '2026-06-10',
            scheduler: {
              resources: [{ id: 'r1', name: '会议室 A' }],
              range: 3,
            },
          }}
        />
      );
    });

    const dateText = container.querySelector('.swell-calendar-toolbar-date');
    expect(dateText?.textContent).toBe('2026年6月10日 - 12日');
    expect(container.querySelectorAll('.swell-calendar-scheduler-header-day-label')).toHaveLength(
      3
    );

    const nextButton = container.querySelector(
      'button[aria-label="下一页"]'
    ) as HTMLButtonElement | null;
    clickButton(nextButton);

    expect(dateText?.textContent).toBe('2026年6月13日 - 15日');
  });

  it('keeps timeline default navigation month-based instead of falling back to a 7-day window', () => {
    act(() => {
      root.render(
        <Calendar
          events={[]}
          options={{
            defaultView: 'timeline',
            initialDate: '2026-06-15',
            timeline: {
              resources: [{ id: 'r1', name: '张三' }],
            },
          }}
        />
      );
    });

    const dateText = container.querySelector('.swell-calendar-toolbar-date');
    expect(dateText?.textContent).toBe('2026年6月');
    expect(container.querySelectorAll('.swell-calendar-timeline-header-day')).toHaveLength(30);

    const nextButton = container.querySelector(
      'button[aria-label="下一页"]'
    ) as HTMLButtonElement | null;
    clickButton(nextButton);

    expect(dateText?.textContent).toBe('2026年7月');
    expect(container.querySelectorAll('.swell-calendar-timeline-header-day')).toHaveLength(31);
  });

  it('shows timeline.range as the actual visible day window and paginates by that window', () => {
    act(() => {
      root.render(
        <Calendar
          events={[]}
          options={{
            defaultView: 'timeline',
            initialDate: '2026-06-10',
            timeline: {
              resources: [{ id: 'r1', name: '张三' }],
              range: 5,
            },
          }}
        />
      );
    });

    const dateText = container.querySelector('.swell-calendar-toolbar-date');
    expect(dateText?.textContent).toBe('2026年6月10日 - 14日');
    expect(container.querySelectorAll('.swell-calendar-timeline-header-day')).toHaveLength(5);

    const nextButton = container.querySelector(
      'button[aria-label="下一页"]'
    ) as HTMLButtonElement | null;
    clickButton(nextButton);

    expect(dateText?.textContent).toBe('2026年6月15日 - 19日');
  });
});
