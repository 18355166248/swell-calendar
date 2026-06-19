import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

import type { ViewId } from './shell';

dayjs.extend(weekOfYear);
dayjs.locale('zh-cn');

export const APP_MONTH_VISIBLE_EVENT_COUNT = 3;
export const APP_SCHEDULER_RANGE = 3;
export const APP_TIMELINE_RANGE = 5;

const DOW_SHORT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function isWeekend(day: number) {
  return day === 0 || day === 6;
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
  context: { resourceCount: number; showWeekend: boolean }
): [string, string] {
  const dj = dayjs(currentDate);
  const year = dj.year();
  const week = dj.week();
  const month = dj.month() + 1;
  const date = dj.date();
  const dow = DOW_SHORT[dj.day()];
  const weekSub = `${year}年 · 第${week}周`;

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
      return [`${year}年 ${month}月`, `${daysInMonth}天`];
    }
    case 'scheduler': {
      const dates = collectVisibleDates(currentDate, APP_SCHEDULER_RANGE, !context.showWeekend);
      return [
        formatRangeTitle(dates[0], dates[dates.length - 1]),
        `${context.resourceCount}项资源 · ${APP_SCHEDULER_RANGE}天窗口`,
      ];
    }
    case 'timeline': {
      const dates = collectVisibleDates(currentDate, APP_TIMELINE_RANGE);
      return [
        formatRangeTitle(dates[0], dates[dates.length - 1]),
        `${context.resourceCount}项资源 · ${APP_TIMELINE_RANGE}天时间线`,
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
}) {
  void input.resourceCount;

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
      visibleEventCount: APP_MONTH_VISIBLE_EVENT_COUNT,
      dragToMove: true,
      dragToResize: true,
      dragToCreate: true,
    },
    scheduler: {
      resources: [],
      hourStart: 8,
      hourEnd: 20,
      columnWidth: 120,
      range: APP_SCHEDULER_RANGE,
    },
    timeline: {
      resources: [],
      rowHeight: input.timelineRowHeight,
      range: APP_TIMELINE_RANGE,
    },
  };
}
