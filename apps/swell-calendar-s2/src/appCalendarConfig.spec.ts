import { describe, expect, it } from 'vitest';

import {
  APP_MONTH_VISIBLE_EVENT_COUNT,
  APP_SCHEDULER_RANGE,
  APP_TIMELINE_RANGE,
  buildCalendarOptions,
  computeViewTitle,
} from './appCalendarConfig';

describe('appCalendarConfig', () => {
  it('wires month visibleEventCount and scheduler/timeline range into calendar options', () => {
    const options = buildCalendarOptions({
      view: 'scheduler',
      currentDate: new Date('2026-06-10T09:00:00'),
      showWeekend: true,
      monthNarrowWeekend: false,
      timelineRowHeight: 64,
      resourceCount: 3,
    });

    expect(options.month.visibleEventCount).toBe(APP_MONTH_VISIBLE_EVENT_COUNT);
    expect(options.scheduler.range).toBe(APP_SCHEDULER_RANGE);
    expect(options.timeline.range).toBe(APP_TIMELINE_RANGE);
  });

  it('shows scheduler title as the actual visible window instead of a single day', () => {
    const [title, sub] = computeViewTitle('scheduler', new Date('2026-06-10T09:00:00'), {
      resourceCount: 3,
      showWeekend: true,
    });

    expect(title).toBe('6月10日 – 12日');
    expect(sub).toBe('3项资源 · 3天窗口');
  });

  it('shows timeline title as the actual visible window instead of the old week wording', () => {
    const [title, sub] = computeViewTitle('timeline', new Date('2026-06-10T09:00:00'), {
      resourceCount: 3,
      showWeekend: true,
    });

    expect(title).toBe('6月10日 – 14日');
    expect(sub).toBe('3项资源 · 5天时间线');
  });
});
