import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

import type { ViewId } from './shell';

dayjs.extend(weekOfYear);
dayjs.locale('zh-cn');

export interface CalendarHostTuning {
  monthMaxEventStack: number;
  schedulerRange: number;
  timelineRange: number;
}

export const DEFAULT_CALENDAR_TUNING: CalendarHostTuning = {
  monthMaxEventStack: 3,
  schedulerRange: 3,
  timelineRange: 5,
};

const DOW_SHORT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MIN_STACK = 1;
const MAX_STACK = 6;
const MIN_RANGE = 1;
const MAX_RANGE = 14;

function isWeekend(day: number) {
  return day === 0 || day === 6;
}

function clampInt(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max);
}

export function sanitizeCalendarTuning(
  tuning: Partial<CalendarHostTuning> | undefined
): CalendarHostTuning {
  return {
    monthMaxEventStack: clampInt(
      tuning?.monthMaxEventStack ?? DEFAULT_CALENDAR_TUNING.monthMaxEventStack,
      MIN_STACK,
      MAX_STACK
    ),
    schedulerRange: clampInt(
      tuning?.schedulerRange ?? DEFAULT_CALENDAR_TUNING.schedulerRange,
      MIN_RANGE,
      MAX_RANGE
    ),
    timelineRange: clampInt(
      tuning?.timelineRange ?? DEFAULT_CALENDAR_TUNING.timelineRange,
      MIN_RANGE,
      MAX_RANGE
    ),
  };
}

function collectVisibleDates(startDate: Date, range: number, skipWeekends = false): Date[] {
  const dates: Date[] = [];
  let cursor = dayjs(startDate).startOf('day');

  while (dates.length < range) {
    if (!skipWeekends || !isWeekend(cursor.day())) {
      dates.push(cursor.toDate());
    }
    cursor = cursor.add(1, 'day');
  }

  return dates;
}

function formatRangeTitle(start: Date, end: Date) {
  const startDay = dayjs(start);
  const endDay = dayjs(end);
  const startMonth = startDay.month() + 1;
  const startDateValue = startDay.date();
  const endMonth = endDay.month() + 1;
  const endDateValue = endDay.date();

  if (startDay.isSame(endDay, 'month')) {
    return `${startMonth}月${startDateValue}日 – ${endDateValue}日`;
  }

  return `${startMonth}月${startDateValue}日 – ${endMonth}月${endDateValue}日`;
}

export function computeViewTitle(
  view: ViewId,
  currentDate: Date,
  context: { resourceCount: number; showWeekend: boolean; tuning: CalendarHostTuning }
): [string, string] {
  const dj = dayjs(currentDate);
  const year = dj.year();
  const week = dj.week();
  const month = dj.month() + 1;
  const date = dj.date();
  const dow = DOW_SHORT[dj.day()];
  const weekSub = `${year}年 · 第${week}周`;
  const tuning = sanitizeCalendarTuning(context.tuning);

  switch (view) {
    case 'day':
      return [`${dow} · ${month}月${date}日`, weekSub];
    case 'week': {
      const start = dj.startOf('week');
      const end = start.add(6, 'day');
      return [formatRangeTitle(start.toDate(), end.toDate()), weekSub];
    }
    case 'month': {
      const daysInMonth = dj.daysInMonth();
      return [
        `${year}年 ${month}月`,
        `${daysInMonth}天 · 每日最多 ${tuning.monthMaxEventStack} 条`,
      ];
    }
    case 'scheduler': {
      const dates = collectVisibleDates(currentDate, tuning.schedulerRange, !context.showWeekend);
      return [
        formatRangeTitle(dates[0], dates[dates.length - 1]),
        `${context.resourceCount}项资源 · ${tuning.schedulerRange}天窗口`,
      ];
    }
    case 'timeline': {
      const dates = collectVisibleDates(currentDate, tuning.timelineRange);
      return [
        formatRangeTitle(dates[0], dates[dates.length - 1]),
        `${context.resourceCount}项资源 · ${tuning.timelineRange}天时间线`,
      ];
    }
    default:
      return [`${month}月${date}日`, weekSub];
  }
}

export function buildCalendarOptions(input: {
  view: ViewId;
  currentDate: Date;
  showWeekend: boolean;
  monthNarrowWeekend: boolean;
  timelineRowHeight: number;
  resourceCount: number;
  tuning: CalendarHostTuning;
}) {
  void input.resourceCount;
  const tuning = sanitizeCalendarTuning(input.tuning);

  return {
    defaultView: input.view,
    initialDate: input.currentDate,
    week: {
      startDayOfWeek: 1,
      hourStart: 8,
      hourEnd: 20,
      workweek: !input.showWeekend,
    },
    month: {
      startDayOfWeek: 1,
      workweek: !input.showWeekend,
      narrowWeekend: input.monthNarrowWeekend,
      maxEventStack: tuning.monthMaxEventStack,
      visibleEventCount: tuning.monthMaxEventStack,
      dragToMove: true,
      dragToResize: true,
      dragToCreate: true,
    },
    scheduler: {
      resources: [],
      hourStart: 8,
      hourEnd: 20,
      columnWidth: 120,
      range: tuning.schedulerRange,
    },
    timeline: {
      resources: [],
      rowHeight: input.timelineRowHeight,
      range: tuning.timelineRange,
    },
  };
}
