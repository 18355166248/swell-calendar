import { isAllday } from '@/controller/event.controller';
import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import { makeDateRange, MS_PER_DAY, toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { AgendaOptions } from '@/types/options.type';
import array from '@/utils/array';

export interface AgendaEventItem {
  uiModel: EventUIModel;
  isAllday: boolean;
  startsBeforeDay: boolean;
  endsAfterDay: boolean;
}

export interface AgendaDayGroup {
  date: DayjsTZDate;
  events: AgendaEventItem[];
  isToday: boolean;
}

function normalizeAgendaRange(range?: number): number {
  if (!Number.isFinite(range) || !range || range < 1) {
    return 14;
  }

  return Math.floor(range);
}

export function getAgendaDays(renderDate: DayjsTZDate, options: Required<AgendaOptions>) {
  const start = toStartOfDay(renderDate);
  const end = toStartOfDay(renderDate).addDate(normalizeAgendaRange(options.range) - 1);

  return makeDateRange(start, end, MS_PER_DAY);
}

function eventIntersectsDay(model: EventModel, day: DayjsTZDate): boolean {
  const dayStart = toStartOfDay(day).getTime();
  const dayEnd = toEndOfDay(day).getTime();

  return model.getStarts().getTime() <= dayEnd && model.getEnds().getTime() >= dayStart;
}

function toAgendaEventItem(uiModel: EventUIModel, day: DayjsTZDate): AgendaEventItem {
  const dayStart = toStartOfDay(day).getTime();
  const dayEnd = toEndOfDay(day).getTime();

  return {
    uiModel,
    isAllday: isAllday(uiModel.model),
    startsBeforeDay: uiModel.model.getStarts().getTime() < dayStart,
    endsAfterDay: uiModel.model.getEnds().getTime() > dayEnd,
  };
}

export function getAgendaDayGroups(
  calendar: CalendarData,
  renderDate: DayjsTZDate,
  options: Required<AgendaOptions>
): AgendaDayGroup[] {
  const days = getAgendaDays(renderDate, options);
  const models = calendar.events
    .toArray()
    .filter((model) => model.isVisible)
    .map((model) => new EventUIModel(model))
    .sort(array.compare.event.asc);
  const today = new DayjsTZDate();

  return days
    .map((date) => {
      const events = models
        .filter((uiModel) => eventIntersectsDay(uiModel.model, date))
        .map((uiModel) => toAgendaEventItem(uiModel, date));

      return {
        date,
        events,
        isToday: date.dayjs.isSame(today.dayjs, 'day'),
      };
    })
    .filter((group) => options.showEmptyDays || group.events.length > 0);
}
