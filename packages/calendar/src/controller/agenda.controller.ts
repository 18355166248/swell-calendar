import { isAllday } from '@/controller/event.controller';
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

function getAgendaStartDate(renderDate: DayjsTZDate, options: Required<AgendaOptions>) {
  return toStartOfDay(renderDate).addDate(Math.trunc(options.offset));
}

export function getAgendaDayCount(options: Required<AgendaOptions>): number {
  return normalizeAgendaRange(options.range);
}

export function getAgendaDateAt(
  renderDate: DayjsTZDate,
  options: Required<AgendaOptions>,
  index: number
) {
  return getAgendaStartDate(renderDate, options).addDate(index);
}

export function getAgendaDays(renderDate: DayjsTZDate, options: Required<AgendaOptions>) {
  const start = getAgendaStartDate(renderDate, options);
  const end = start.addDate(normalizeAgendaRange(options.range) - 1);

  return makeDateRange(start, end, MS_PER_DAY);
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

export function getAgendaDayGroup(
  calendar: CalendarData,
  date: DayjsTZDate,
  uiModelCache: Map<number, EventUIModel> = new Map(),
  today = new DayjsTZDate()
): AgendaDayGroup {
  const ids = calendar.idsOfDay[date.dayjs.format('YYYYMMDD')] ?? [];
  // idsOfDay 是事件写入时维护的日期索引；Agenda 长窗口按天取命中事件，
  // 避免切到列表时执行「天数 × 全量事件」扫描。移动端虚拟列表还会按可见窗口懒生成 group，
  // 进一步避免一次性为千级日期窗口创建 EventUIModel。
  const events = ids
    .map((cid) => {
      const model = calendar.events.get(cid);
      if (!model?.isVisible) return null;

      const cached = uiModelCache.get(cid);
      if (cached) return cached;

      const next = new EventUIModel(model);
      uiModelCache.set(cid, next);
      return next;
    })
    .filter((uiModel): uiModel is EventUIModel => uiModel !== null)
    .sort(array.compare.event.asc)
    .map((uiModel) => toAgendaEventItem(uiModel, date));

  return {
    date,
    events,
    isToday: date.dayjs.isSame(today.dayjs, 'day'),
  };
}

export function getAgendaDayGroups(
  calendar: CalendarData,
  renderDate: DayjsTZDate,
  options: Required<AgendaOptions>
): AgendaDayGroup[] {
  const days = getAgendaDays(renderDate, options);
  const uiModelCache = new Map<number, EventUIModel>();
  const today = new DayjsTZDate();

  return days
    .map((date) => {
      return getAgendaDayGroup(calendar, date, uiModelCache, today);
    })
    .filter((group) => options.showEmptyDays || group.events.length > 0);
}
