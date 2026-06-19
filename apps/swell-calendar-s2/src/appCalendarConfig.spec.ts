import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CALENDAR_TUNING,
  buildCalendarOptions,
  computeViewTitle,
  type CalendarHostTuning,
} from './appCalendarConfig';

describe('appCalendarConfig', () => {
  it('wires month maxEventStack and scheduler/timeline range tuning into calendar options', () => {
    const tuning: CalendarHostTuning = {
      monthMaxEventStack: 2,
      schedulerRange: 4,
      timelineRange: 6,
    };
    const options = buildCalendarOptions({
      view: 'scheduler',
      currentDate: new Date('2026-06-10T09:00:00'),
      showWeekend: true,
      monthNarrowWeekend: false,
      timelineRowHeight: 64,
      resourceCount: 3,
      tuning,
    });

    expect(options.month.maxEventStack).toBe(tuning.monthMaxEventStack);
    expect(options.month.visibleEventCount).toBe(tuning.monthMaxEventStack);
    expect(options.scheduler.range).toBe(tuning.schedulerRange);
    expect(options.timeline.range).toBe(tuning.timelineRange);
  });

  it('shows scheduler title using the tuned visible window instead of a single day', () => {
    const tuning: CalendarHostTuning = {
      ...DEFAULT_CALENDAR_TUNING,
      schedulerRange: 4,
    };
    const [title, sub] = computeViewTitle('scheduler', new Date('2026-06-10T09:00:00'), {
      resourceCount: 3,
      showWeekend: true,
      tuning,
    });

    expect(title).toBe('6月10日 – 13日');
    expect(sub).toBe('3项资源 · 4天窗口');
  });

  it('shows timeline title using the tuned visible window instead of the old week wording', () => {
    const tuning: CalendarHostTuning = {
      ...DEFAULT_CALENDAR_TUNING,
      timelineRange: 6,
    };
    const [title, sub] = computeViewTitle('timeline', new Date('2026-06-10T09:00:00'), {
      resourceCount: 3,
      showWeekend: true,
      tuning,
    });

    expect(title).toBe('6月10日 – 15日');
    expect(sub).toBe('3项资源 · 6天时间线');
  });
});
