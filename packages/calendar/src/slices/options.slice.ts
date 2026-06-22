import { produce } from 'immer';

import { DEFAULT_DAY_NAMES } from '@/helpers/dayName';
import { Day } from '@/time/datetime';
import {
  AgendaOptions,
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

function initializeMonthOptions(
  monthOptions: Options['month'] = {},
  isReadOnly = false
): Required<MonthOptions> {
  const normalizedMaxEventStack = monthOptions.maxEventStack ?? monthOptions.visibleEventCount ?? 4;
  const month: Required<MonthOptions> = {
    startDayOfWeek: Day.SUN,
    dayNames: [],
    narrowWeekend: false,
    workweek: false,
    isAlways6Weeks: true,
    visibleWeeksCount: 0,
    maxEventStack: normalizedMaxEventStack,
    visibleEventCount: normalizedMaxEventStack,
    dragToMove: true,
    dragToResize: true,
    dragToCreate: true,
    ...monthOptions,
  };
  month.maxEventStack =
    monthOptions.maxEventStack ?? month.visibleEventCount ?? normalizedMaxEventStack;
  month.visibleEventCount = month.maxEventStack;
  if (!month.dayNames || month.dayNames.length === 0) {
    month.dayNames = DEFAULT_DAY_NAMES.slice() as Required<MonthOptions>['dayNames'];
  }

  if (isReadOnly) {
    month.dragToMove = false;
    month.dragToResize = false;
    month.dragToCreate = false;
  }

  return month;
}

function initializeEnabledViews(options: Options = {}): EnabledViews {
  return {
    day: options.views?.day !== false,
    week: options.views?.week !== false,
    month: options.views?.month !== false,
    agenda: options.views?.agenda !== false,
    scheduler: options.views?.scheduler !== false,
    timeline: options.views?.timeline !== false,
  };
}

function initializeAgendaOptions(agendaOptions: Options['agenda'] = {}): Required<AgendaOptions> {
  return {
    range: 14,
    showEmptyDays: true,
    ...agendaOptions,
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
      month: initializeMonthOptions(options.month, options.isReadOnly ?? false),
      agenda: initializeAgendaOptions(options.agenda),
      calendars: options.calendars ?? [],
      scheduler: initializeSchedulerOptions(options.scheduler),
      timeline: initializeTimelineOptions(options.timeline),
      setOptions: (options) => {
        set(
          produce((state: CalendarStore) => {
            state.options.week = initializeWeekOptions(options.week);
            state.options.month = initializeMonthOptions(
              options.month,
              options.isReadOnly ?? false
            );
            state.options.agenda = initializeAgendaOptions(options.agenda);
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
