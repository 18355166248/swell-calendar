import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { toStartOfDay, toEndOfDay } from '@/time/datetime';
import { CalendarData } from '@/types/calendar.type';
import { MonthOptions } from '@/types/options.type';
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

export function getMonthWeeks(
  renderDate: DayjsTZDate,
  options: Required<MonthOptions>
): DayjsTZDate[][] {
  const { startDayOfWeek, isAlways6Weeks } = options;
  const monthStart = new DayjsTZDate(renderDate.dayjs.startOf('month').toDate());
  const monthEnd = new DayjsTZDate(renderDate.dayjs.endOf('month').toDate());

  // 找到网格起始日（对齐到 startDayOfWeek）
  const startDay = monthStart.getDay();
  const offsetDays = ((startDay - startDayOfWeek) + 7) % 7;
  let gridStart = monthStart.addDate(-offsetDays);

  const weeks: DayjsTZDate[][] = [];

  while (true) {
    const week: DayjsTZDate[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(gridStart.addDate(i));
    }
    weeks.push(week);
    gridStart = gridStart.addDate(7);

    const weekEnd = week[6];
    if (weekEnd.getTime() >= monthEnd.getTime()) {
      break;
    }
  }

  if (isAlways6Weeks && weeks.length < 6) {
    while (weeks.length < 6) {
      const lastWeekEnd = weeks[weeks.length - 1][6];
      const nextWeekStart = lastWeekEnd.addDate(1);
      const week: DayjsTZDate[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(nextWeekStart.addDate(i));
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
    const overflowByCol: number[] = new Array(7).fill(0);
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
      const ec = endCol === -1 ? 6 : endCol;
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
