import { EventUIModel } from '@/model/eventUIModel';
import { isWeekend, toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { MonthOptions, Options } from '@/types/options.type';

import { convertToUIModel, getEventInDateRangeFilter } from './core.controller';

export interface MonthEventRowInfo {
  uiModel: EventUIModel;
  startCol: number;
  colspan: number;
  slotIndex: number;
}

export interface MonthWeekEventData {
  rows: MonthEventRowInfo[];
  overflowByCol: number[];
}

export function getMonthDayNames(options: Options) {
  const { dayNames, startDayOfWeek, workweek } = options.month as Required<MonthOptions>;
  const dayIndices = [...Array(7)].map((_, i) => (startDayOfWeek + i) % 7);

  return dayIndices
    .map((dayIndex) => ({
      day: dayIndex,
      label: dayNames[dayIndex],
    }))
    .filter((value) => (workweek ? !isWeekend(value.day) : true));
}

export function getMonthWeeks(
  renderDate: DayjsTZDate,
  options: Required<MonthOptions>
): DayjsTZDate[][] {
  const { startDayOfWeek, isAlways6Weeks, workweek } = options;
  const monthStart = new DayjsTZDate(renderDate.dayjs.startOf('month').toDate());
  const monthEnd = new DayjsTZDate(renderDate.dayjs.endOf('month').toDate());

  // 找到网格起始日（对齐到 startDayOfWeek）
  const startDay = monthStart.getDay();
  const offsetDays = (startDay - startDayOfWeek + 7) % 7;
  let gridStart = monthStart.addDate(-offsetDays);

  const weeks: DayjsTZDate[][] = [];

  while (true) {
    const week: DayjsTZDate[] = [];
    for (let i = 0; i < 7; i++) {
      const date = gridStart.addDate(i);
      if (!workweek || !isWeekend(date.getDay())) {
        week.push(date);
      }
    }
    weeks.push(week);
    gridStart = gridStart.addDate(7);

    const weekEnd = week[week.length - 1];
    if (weekEnd.getTime() >= monthEnd.getTime()) {
      break;
    }
  }

  if (isAlways6Weeks && weeks.length < 6) {
    while (weeks.length < 6) {
      const lastWeek = weeks[weeks.length - 1];
      const lastWeekEnd = lastWeek[lastWeek.length - 1];
      const nextWeekStart = lastWeekEnd.addDate(1);
      const week: DayjsTZDate[] = [];
      for (let i = 0; i < 7; i++) {
        const date = nextWeekStart.addDate(i);
        if (!workweek || !isWeekend(date.getDay())) {
          week.push(date);
        }
      }
      weeks.push(week);
    }
  }

  return weeks;
}

export function getMonthEventRows(
  calendarData: CalendarData,
  weeks: DayjsTZDate[][],
  visibleEventCount = 4
): MonthWeekEventData[] {
  const uiModelColl = convertToUIModel(calendarData.events);
  const allModels: EventUIModel[] = [];
  uiModelColl.each((m) => {
    allModels.push(m);
  });

  return weeks.map((week) => {
    const weekStart = toStartOfDay(week[0]);
    const weekEnd = toEndOfDay(week[6]);

    const filter = getEventInDateRangeFilter(weekStart, weekEnd);
    const weekModels = allModels
      .filter((m) => filter(m.model))
      .sort((a, b) => a.getStarts().getTime() - b.getStarts().getTime());

    const slotEndCol: number[] = new Array(visibleEventCount).fill(0);
    const overflowByCol: number[] = new Array(week.length).fill(0);
    const rows: MonthEventRowInfo[] = [];

    weekModels.forEach((uiModel) => {
      const eventStart = uiModel.getStarts();
      const eventEnd = uiModel.getEnds();

      const clampedStart = eventStart.getTime() < weekStart.getTime() ? weekStart : eventStart;
      const clampedEnd = eventEnd.getTime() > weekEnd.getTime() ? weekEnd : eventEnd;

      const startCol = week.findIndex(
        (d) =>
          toStartOfDay(d).getTime() <= clampedStart.getTime() &&
          toEndOfDay(d).getTime() >= clampedStart.getTime()
      );
      const endCol = week.findIndex(
        (d) =>
          toStartOfDay(d).getTime() <= clampedEnd.getTime() &&
          toEndOfDay(d).getTime() >= clampedEnd.getTime()
      );

      const sc = startCol === -1 ? 0 : startCol;
      const ec = endCol === -1 ? week.length - 1 : endCol;
      const colspan = ec - sc + 1;

      let slotIndex = -1;
      for (let i = 0; i < visibleEventCount; i++) {
        if (slotEndCol[i] <= sc) {
          slotIndex = i;
          slotEndCol[i] = sc + colspan;
          break;
        }
      }

      if (slotIndex === -1) {
        for (let c = sc; c < sc + colspan; c++) {
          overflowByCol[c] = (overflowByCol[c] ?? 0) + 1;
        }
        return;
      }

      rows.push({ uiModel, startCol: sc, colspan, slotIndex });
    });

    return { rows, overflowByCol };
  });
}
