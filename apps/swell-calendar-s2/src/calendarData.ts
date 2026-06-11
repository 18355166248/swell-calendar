// 数据适配层：将 S2 app 的 mock 数据转换为 swell-calendar 的 EventObject / ResourceInfo 格式。
import type { EventObject, ResourceInfo } from 'swell-calendar';

import { type Cat, type CalEvent, type Resource, events, resources } from './data';
import type { PickEvent } from './views';

// oklch 色彩映射（对应 spectrum-tokens.css 中的 CSS 变量）
const CAT_COLORS: Record<Cat, { line: string; fill: string; text: string }> = {
  seafoam: {
    line: 'oklch(0.62 0.09 192)',
    fill: 'oklch(0.93 0.04 192)',
    text: 'oklch(0.4 0.07 192)',
  },
  indigo: {
    line: 'oklch(0.55 0.16 282)',
    fill: 'oklch(0.93 0.05 282)',
    text: 'oklch(0.42 0.13 282)',
  },
  magenta: {
    line: 'oklch(0.58 0.19 348)',
    fill: 'oklch(0.94 0.045 348)',
    text: 'oklch(0.45 0.15 348)',
  },
  orange: {
    line: 'oklch(0.68 0.16 55)',
    fill: 'oklch(0.94 0.05 65)',
    text: 'oklch(0.5 0.12 50)',
  },
  green: {
    line: 'oklch(0.62 0.13 150)',
    fill: 'oklch(0.93 0.05 150)',
    text: 'oklch(0.43 0.1 150)',
  },
  purple: {
    line: 'oklch(0.55 0.15 310)',
    fill: 'oklch(0.93 0.05 310)',
    text: 'oklch(0.43 0.12 310)',
  },
};

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

/** 将 S2 mock CalEvent 转换为 swell-calendar EventObject */
export function toCalendarEvents(evts: CalEvent[]): EventObject[] {
  return evts.map((e) => {
    const colors = CAT_COLORS[e.cat];
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
      end: makeDate(e.day, e.end),
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
    const colors = CAT_COLORS[r.color];
    return {
      id: r.id,
      name: r.name,
      backgroundColor: colors.line,
      color: colors.text,
    };
  });
}

/** 预转换数据 */
export const calendarEvents = toCalendarEvents(events);
export const calendarResources = toCalendarResources(resources);

/** 分类颜色查找（供 calendars prop 使用） */
export const calendarCalendars = Object.entries(CAT_COLORS).map(([id, colors]) => ({
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
