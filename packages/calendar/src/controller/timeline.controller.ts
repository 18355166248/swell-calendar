import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';

import { convertToUIModel, getEventInDateRangeFilter } from './core.controller';

const MS_PER_HOUR = 60 * 60 * 1000;

export function getTimelineEvents(
  calendar: CalendarData,
  resourceId: string,
  weekStart: DayjsTZDate,
  weekEnd: DayjsTZDate,
  hourStart: number,
  hourEnd: number
): EventUIModel[] {
  const hoursPerDay = hourEnd - hourStart;
  const totalDays = weekEnd.dayjs.diff(weekStart.dayjs, 'day') + 1;
  const totalMs = totalDays * hoursPerDay * MS_PER_HOUR;
  const baseMs = weekStart.getTime() + hourStart * MS_PER_HOUR;

  const dateFilter = getEventInDateRangeFilter(weekStart, weekEnd);

  const filtered = calendar.events.filter(
    (event) => dateFilter(event) && event.resourceId === resourceId
  );

  const uiModels = convertToUIModel(filtered).toArray();

  uiModels.forEach((uiModel) => {
    const startMs = uiModel.getStarts().getTime();
    const endMs = uiModel.getEnds().getTime();

    const clampedStart = Math.max(startMs - baseMs, 0);
    const clampedEnd = Math.min(endMs - baseMs, totalMs);

    uiModel.left = (clampedStart / totalMs) * 100;
    uiModel.width = Math.max(((clampedEnd - clampedStart) / totalMs) * 100, 0.5);
    uiModel.exceedLeft = startMs < baseMs;
    uiModel.exceedRight = endMs > baseMs + totalMs;
  });

  return uiModels;
}
