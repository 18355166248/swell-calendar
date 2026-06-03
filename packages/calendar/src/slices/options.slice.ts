import { produce } from 'immer';

import { DEFAULT_DAY_NAMES } from '@/helpers/dayName';
import { Day } from '@/time/datetime';
import {
  EnabledViews,
  InvalidRange,
  MonthOptions,
  Options,
  OptionsSlice,
  SchedulerOptions,
  TimelineOptions,
} from '@/types/options.type';
import { CalendarWeekOptions } from '@/types/store.type';
import { CalendarStore } from '@/types/store.type';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

function normalizeInvalidRanges(
  invalid?: InvalidRange[],
  blockedTimes?: InvalidRange[]
): InvalidRange[] {
  return invalid ?? blockedTimes ?? [];
}

function initializeWeekOptions(weekOptions: Options['week'] = {}): CalendarWeekOptions {
  const invalid = normalizeInvalidRanges(weekOptions.invalid, weekOptions.blockedTimes);
  const week: CalendarWeekOptions = {
    startDayOfWeek: Day.SUN,
    dayNames: [],
    narrowWeekend: false,
    workweek: false,
    hourStart: 0,
    hourEnd: 24,
    eventView: true,
    taskView: true,
    hourDivision: 2,
    invalid,
    blockedTimes: invalid,
    ...weekOptions,
  };

  week.invalid = invalid;
  week.blockedTimes = invalid;

  return week;
}

function initializeMonthOptions(monthOptions: Options['month'] = {}): Required<MonthOptions> {
  const month: Required<MonthOptions> = {
    startDayOfWeek: Day.SUN,
    dayNames: [],
    narrowWeekend: false,
    workweek: false,
    isAlways6Weeks: true,
    visibleWeeksCount: 0,
    visibleEventCount: 6,
    ...monthOptions,
  };
  if (!month.dayNames || month.dayNames.length === 0) {
    month.dayNames = DEFAULT_DAY_NAMES.slice() as Required<MonthOptions>['dayNames'];
  }

  return month;
}

function initializeEnabledViews(options: Options = {}): EnabledViews {
  return {
    day: options.views?.day !== false,
    week: options.views?.week !== false,
    month: options.views?.month !== false,
    scheduler: options.views?.scheduler !== false,
    timeline: options.views?.timeline !== false,
  };
}

function initializeSchedulerOptions(schedulerOptions: Options['scheduler'] = {}): SchedulerOptions {
  const invalid = normalizeInvalidRanges(schedulerOptions.invalid, schedulerOptions.blockedTimes);
  const scheduler: SchedulerOptions = {
    resources: [],
    hourStart: 0,
    hourEnd: 24,
    invalid,
    blockedTimes: invalid,
    ...schedulerOptions,
  };

  scheduler.invalid = invalid;
  scheduler.blockedTimes = invalid;

  return scheduler;
}

function initializeTimelineOptions(timelineOptions: Options['timeline'] = {}): TimelineOptions {
  const invalid = normalizeInvalidRanges(timelineOptions.invalid, timelineOptions.blockedTimes);
  const timeline: TimelineOptions = {
    resources: [],
    hourStart: 0,
    hourEnd: 24,
    rowHeight: 56,
    cellWidth: 80,
    invalid,
    blockedTimes: invalid,
    ...timelineOptions,
  };

  timeline.invalid = invalid;
  timeline.blockedTimes = invalid;

  return timeline;
}

export function createOptionsSlice(options: Options = {}) {
  return (set: SetState): OptionsSlice => ({
    options: {
      defaultView: options.defaultView ?? 'week',
      initialDate: options.initialDate,
      isReadOnly: options.isReadOnly ?? false,
      views: initializeEnabledViews(options),
      week: initializeWeekOptions(options.week),
      month: initializeMonthOptions(options.month),
      calendars: options.calendars ?? [],
      scheduler: initializeSchedulerOptions(options.scheduler),
      timeline: initializeTimelineOptions(options.timeline),
      setOptions: (options) => {
        set(
          produce((state: CalendarStore) => {
            state.options.week = initializeWeekOptions(options.week);
            state.options.month = initializeMonthOptions(options.month);
            state.options.calendars = options.calendars ?? [];
            state.options.views = initializeEnabledViews(options);
            state.options.defaultView = options.defaultView ?? 'week';
            state.options.initialDate = options.initialDate;
            state.options.isReadOnly = options.isReadOnly ?? false;
            state.options.scheduler = initializeSchedulerOptions(options.scheduler);
            state.options.timeline = initializeTimelineOptions(options.timeline);
          })
        );
      },
    },
  });
}
