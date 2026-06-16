// 数据适配层：将 S2 app 的 mock 数据转换为 swell-calendar 的 EventObject / ResourceInfo 格式。
import type { EventObject, ResourceInfo } from 'swell-calendar';

import {
  CAT_COLOR_STYLES,
  type Cat,
  type CalEvent,
  type PickEvent,
  type Resource,
  resources,
} from './data';
import type { EventDraft } from './dataSource';
import type { NewEventInput } from './overlays';

// 基准日期：day 0 = 2025-03-17（周一，与日历 week startDayOfWeek=1 对齐）
const BASE_DATE = new Date(2025, 2, 17);

function makeDate(dayIndex: number, decimalHours: number): Date {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + dayIndex);
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** 把 `YYYY-MM-DD` 转成相对 BASE_DATE(2025-03-17) 的天偏移（CalEvent.day 语义）。 */
export function dateToDayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, (m || 1) - 1, d || 1);
  return Math.round((target.getTime() - BASE_DATE.getTime()) / 86_400_000);
}

/** 把 `HH:mm` 转成十进制小时（CalEvent.start/end 语义），如 09:30 → 9.5。 */
export function timeToDecimalHour(time: string): number {
  const [h, min] = time.split(':').map(Number);
  return (h || 0) + (min || 0) / 60;
}

/** dateToDayIndex 的逆：天偏移 → `YYYY-MM-DD`（编辑回填用）。 */
export function dayIndexToDate(dayIndex: number): string {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + dayIndex);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** timeToDecimalHour 的逆：十进制小时 → `HH:mm`（编辑回填用），如 9.5 → 09:30。 */
export function decimalHourToTime(decimalHours: number): string {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 将 S2 mock CalEvent 转换为 swell-calendar EventObject */
export function toCalendarEvents(evts: CalEvent[]): EventObject[] {
  return evts.map((e) => {
    const colors = CAT_COLOR_STYLES[e.cat];
    const pickMeta = {
      cat: e.cat,
      who: e.who,
      loc: e.loc,
      desc: e.desc,
    };

    return {
      id: e.id,
      calendarId: e.cat,
      title: e.title,
      start: makeDate(e.day, e.start),
      // 跨天事件结束落在 endDay；endDay 省略时等同 day（单日事件）
      end: makeDate(e.endDay ?? e.day, e.end),
      resourceId: e.res,
      category: 'time' as const,
      backgroundColor: colors.fill,
      color: colors.text,
      borderColor: colors.line,
      raw: e,
      meta: {
        pickMeta,
      },
    };
  });
}

/** 将 S2 mock Resource 转换为 swell-calendar ResourceInfo */
export function toCalendarResources(res: Resource[]): ResourceInfo[] {
  return res.map((r) => {
    const colors = CAT_COLOR_STYLES[r.color];
    return {
      id: r.id,
      name: r.name,
      backgroundColor: colors.line,
      color: colors.text,
    };
  });
}

/** 预转换数据 */
export const calendarResources = toCalendarResources(resources);

/** 分类颜色查找（供 calendars prop 使用） */
export const calendarCalendars = Object.entries(CAT_COLOR_STYLES).map(([id, colors]) => ({
  id,
  name: id,
  backgroundColor: colors.fill,
  color: colors.text,
  borderColor: colors.line,
}));

type DateLike = Date | string | number | { toDate: () => Date };

function toNativeDate(dateLike: DateLike) {
  if (typeof dateLike === 'object' && dateLike !== null && 'toDate' in dateLike) {
    return dateLike.toDate();
  }

  return new Date(dateLike);
}

function toDecimalHour(dateLike: DateLike) {
  const date = toNativeDate(dateLike);
  return date.getHours() + date.getMinutes() / 60;
}

function toDateLabel(dateLike: DateLike) {
  const date = toNativeDate(dateLike);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 事件详情弹层仍然沿用设计稿的 PickEvent 结构，这里把日历引擎事件回填为完整 mock 语义，
 * 避免点击真引擎事件后丢失时间、地点和参与人。
 */
export function toPickEvent(event: EventObject): PickEvent {
  const raw = event.raw as CalEvent | undefined;
  const pickMeta =
    typeof event.meta === 'object' && event.meta && 'pickMeta' in event.meta
      ? (event.meta.pickMeta as {
          cat?: Cat;
          who?: string;
          loc?: string;
          desc?: string;
        })
      : undefined;

  return {
    id: event.id,
    title: event.title || raw?.title || '',
    cat: pickMeta?.cat || (event.calendarId as Cat | undefined) || raw?.cat || 'seafoam',
    dateLabel: event.start ? toDateLabel(event.start as DateLike) : undefined,
    who: pickMeta?.who || raw?.who,
    loc: pickMeta?.loc || raw?.loc,
    desc: pickMeta?.desc || raw?.desc,
    start: event.start ? toDecimalHour(event.start as DateLike) : raw?.start || 0,
    end: event.end ? toDecimalHour(event.end as DateLike) : raw?.end || 0,
  };
}

/**
 * 将引擎事件对象转回 EventDraft（供 onEventCreate / onEventUpdate 回调使用）。
 *
 * - 更新路径（event.raw 存在）：以原事件为底合并，只覆盖时间 / 资源，
 *   保留 title / cat / who / desc 等业务字段，防止 override 全量替换时丢失。
 * - 新建路径（无 raw）：从引擎 event 字段直接构建 draft。
 */
export function engineEventToDraft(event: EventObject): EventDraft {
  const raw = event.raw as CalEvent | undefined;
  const start = event.start ? toDecimalHour(event.start as DateLike) : 0;
  const end = event.end ? toDecimalHour(event.end as DateLike) : 0;
  const startDate = event.start ? toNativeDate(event.start as DateLike) : null;
  const endDate = event.end ? toNativeDate(event.end as DateLike) : null;
  const day = startDate ? dateToDayIndex(formatISODate(startDate)) : 0;
  // 跨天拖拽：结束落在不同天 → endDay > day。单日时 endDay === day。
  const endDay = endDate ? dateToDayIndex(formatISODate(endDate)) : day;
  const res = (event.resourceId as string) || raw?.res || resources[0]?.id || '';

  if (raw) {
    // 更新路径：以原事件为底，只覆盖时间/资源（排除 id，保持 EventDraft = Omit<CalEvent, 'id'>）
    // endDay 必须显式覆盖，否则旧值会盖掉本次拖拽产生的跨天跨度
    const { id: _, ...rest } = raw;
    return { ...rest, day, endDay, start, end, res };
  }

  // 新建路径：从引擎字段构建
  const resource = resources.find((r) => r.id === res);
  return {
    title: event.title || '新日程',
    cat: (event.calendarId as Cat) || 'seafoam',
    day,
    endDay,
    start,
    end,
    res,
    loc: resource?.short,
  };
}

/**
 * 对话框输入（NewEventInput）↔ 数据草稿（EventDraft）/ 引擎事件 的转换。
 * 集中放在数据适配层，保证跨天字段（date/endDate ↔ day/endDay）在整条
 * 新建/编辑链路上不被丢弃，并可独立单测。
 */

/** 对话框输入 → 事件草稿；编辑时传入原事件以保留 who/desc 等对话框不编辑的字段。 */
export function inputToDraft(input: NewEventInput, base?: CalEvent): EventDraft {
  const resource = resources.find((r) => r.id === input.res);
  return {
    ...base,
    res: input.res,
    day: dateToDayIndex(input.date),
    endDay: dateToDayIndex(input.endDate),
    start: timeToDecimalHour(input.start),
    end: timeToDecimalHour(input.end),
    title: input.title,
    cat: input.cat,
    loc: resource?.short,
  };
}

/** CalEvent → 对话框预填输入（编辑回填用）。 */
export function calEventToInput(e: CalEvent): NewEventInput {
  return {
    title: e.title,
    res: e.res,
    date: dayIndexToDate(e.day),
    endDate: dayIndexToDate(e.endDay ?? e.day),
    start: decimalHourToTime(e.start),
    end: decimalHourToTime(e.end),
    cat: e.cat,
  };
}

/** 引擎事件对象 → 新建对话框的预填输入（滑动新建 / 单元格点击用）。 */
export function engineEventToCreateInput(event: EventObject): NewEventInput {
  const draft = engineEventToDraft(event);
  return {
    title: draft.title,
    res: draft.res,
    date: dayIndexToDate(draft.day),
    endDate: dayIndexToDate(draft.endDay ?? draft.day),
    start: decimalHourToTime(draft.start),
    end: decimalHourToTime(draft.end),
    cat: draft.cat,
  };
}

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
