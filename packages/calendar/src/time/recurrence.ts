import type { DateType, RecurrenceRule } from '@/types/events.type';

import { isSameDate } from './datetime';
import DayjsTZDate from './dayjs-tzdate';

/**
 * 归一化 DateType 为 DayjsTZDate
 */
function toTZDate(d: DateType): DayjsTZDate {
  return d instanceof DayjsTZDate ? d : new DayjsTZDate(d);
}

/**
 * 检查 date 是否在 exceptions 列表中（仅按日期部分比较）
 */
function isExceptionDate(date: DayjsTZDate, exceptions?: DateType[]): boolean {
  if (!exceptions || exceptions.length === 0) return false;
  return exceptions.some((ex) => isSameDate(date, toTZDate(ex)));
}

/**
 * 比较两个日期的日期部分是否相同
 */
function sameDate(a: DayjsTZDate, b: DayjsTZDate): boolean {
  return isSameDate(a, b);
}

/**
 * 日期是否在闭区间 [start, end] 内（日期级比较）
 */
function dateInRange(date: DayjsTZDate, rangeStart: DayjsTZDate, rangeEnd: DayjsTZDate): boolean {
  const d = new DayjsTZDate(date).setHours(0, 0, 0, 0);
  const s = new DayjsTZDate(rangeStart).setHours(0, 0, 0, 0);
  const e = new DayjsTZDate(rangeEnd).setHours(0, 0, 0, 0);
  return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
}

/**
 * recurrence 视口内展开结果
 */
export interface RecurrenceResult {
  /** 展开后的发生日期列表（升序，已排除 exceptions 中的日期） */
  dates: DayjsTZDate[];
  /** 实际生成的总发生次数（不含 exception 排除，不含视口截断） */
  totalOccurrences: number;
  /** 是否因到达 count 而截断 */
  truncatedByCount: boolean;
  /** 是否因到达 until 而截断 */
  truncatedByUntil: boolean;
}

/**
 * 在视口 [rangeStart, rangeEnd] 内展开 recurrence 规则
 *
 * @param rule         - 重复规则
 * @param eventStart   - 事件首次发生的日期（作为 recurrence 起点）
 * @param rangeStart   - 视口起点（含）
 * @param rangeEnd     - 视口终点（含）
 * @returns 展开结果
 */
export function expandRecurrence(
  rule: RecurrenceRule,
  eventStart: DayjsTZDate,
  rangeStart: DayjsTZDate,
  rangeEnd: DayjsTZDate
): RecurrenceResult {
  // 防御：interval <= 0 或 count === 0 均视为无效输入，返回空
  const interval = rule.interval ?? 1;
  if (interval <= 0 || rule.count === 0) {
    return { dates: [], totalOccurrences: 0, truncatedByCount: false, truncatedByUntil: false };
  }

  const untilDate = rule.until ? toTZDate(rule.until) : null;
  const exceptions = rule.exceptions;

  // 实际的截止日期：取 until 和 rangeEnd 中较早的
  const effectiveEnd = untilDate
    ? new DayjsTZDate(Math.min(untilDate.getTime(), rangeEnd.getTime()))
    : rangeEnd;

  const start = new DayjsTZDate(eventStart).setHours(0, 0, 0, 0);

  let dates: DayjsTZDate[] = [];
  let truncatedByCount = false;
  let truncatedByUntil = false;

  switch (rule.frequency) {
    case 'daily':
      dates = expandDaily(start, interval, rangeStart, rangeEnd, effectiveEnd, rule.count);
      break;
    case 'weekly':
      dates = expandWeekly(
        start,
        interval,
        rangeStart,
        rangeEnd,
        effectiveEnd,
        rule.count,
        rule.byWeekDays
      );
      break;
    case 'monthly':
      dates = expandMonthly(
        start,
        interval,
        rangeStart,
        rangeEnd,
        effectiveEnd,
        rule.count,
        rule.byMonthDays
      );
      break;
    case 'yearly':
      dates = expandYearly(start, interval, rangeStart, rangeEnd, effectiveEnd, rule.count);
      break;
  }

  const totalOccurrences = dates.length;

  // 判断截断原因
  if (untilDate && dates.length > 0) {
    const last = dates[dates.length - 1];
    if (last.getTime() > untilDate.getTime()) {
      truncatedByUntil = true;
    }
  }
  if (rule.count && totalOccurrences >= rule.count) {
    truncatedByCount = true;
  }

  // 排除 exceptions 中的日期
  dates = dates.filter((d) => !isExceptionDate(d, exceptions));

  return { dates, totalOccurrences, truncatedByCount, truncatedByUntil };
}

// ==================== 各频率展开实现 ====================

function expandDaily(
  start: DayjsTZDate,
  interval: number,
  rangeStart: DayjsTZDate,
  rangeEnd: DayjsTZDate,
  effectiveEnd: DayjsTZDate,
  count?: number
): DayjsTZDate[] {
  const results: DayjsTZDate[] = [];
  let cursor = new DayjsTZDate(start);
  let generated = 0;

  while (true) {
    if (count && generated >= count) break;
    if (cursor.getTime() > effectiveEnd.getTime()) break;

    if (dateInRange(cursor, rangeStart, effectiveEnd)) {
      results.push(new DayjsTZDate(cursor));
      generated++;
    }

    cursor = cursor.addDate(interval);
  }

  return results;
}

function expandWeekly(
  start: DayjsTZDate,
  interval: number,
  rangeStart: DayjsTZDate,
  rangeEnd: DayjsTZDate,
  effectiveEnd: DayjsTZDate,
  count?: number,
  byWeekDays?: number[]
): DayjsTZDate[] {
  const weekDays = byWeekDays && byWeekDays.length > 0 ? byWeekDays : [start.getDay()];

  // weekly interval 必须以事件首发生周为锚点，而不是以当前视口周为锚点。
  // 否则日/多日视图每次查询不同视口时，interval=2 会被重新对齐，错误地每周都展开。
  const anchorWeekStart = new DayjsTZDate(start).setHours(0, 0, 0, 0).addDate(-start.getDay());

  const results: DayjsTZDate[] = [];
  let generated = 0;
  // 安全上限：周数 × interval，足够覆盖正常场景
  const maxWeeks =
    Math.ceil((effectiveEnd.getTime() - anchorWeekStart.getTime()) / (86400000 * 7 * interval)) +
    10;
  let weekIndex = 0;

  while (weekIndex < maxWeeks) {
    if (count && generated >= count) break;

    const weekBase = anchorWeekStart.addDate(weekIndex * 7 * interval);

    for (const wd of weekDays) {
      if (count && generated >= count) break;

      const candidate = weekBase.addDate((wd - weekBase.getDay() + 7) % 7);

      if (candidate.getTime() < start.getTime()) continue;
      if (candidate.getTime() > effectiveEnd.getTime()) {
        // 已超出 effectiveEnd，不再生成
        weekIndex = maxWeeks; // 跳出外层循环
        break;
      }

      if (dateInRange(candidate, rangeStart, effectiveEnd)) {
        // 检查是否已存在（避免同一天重复）
        if (!results.some((d) => sameDate(d, candidate))) {
          results.push(new DayjsTZDate(candidate));
          generated++;
        }
      }
    }

    weekIndex++;
  }

  return results;
}

function expandMonthly(
  start: DayjsTZDate,
  interval: number,
  rangeStart: DayjsTZDate,
  rangeEnd: DayjsTZDate,
  effectiveEnd: DayjsTZDate,
  count?: number,
  byMonthDays?: number[]
): DayjsTZDate[] {
  const monthDays = byMonthDays && byMonthDays.length > 0 ? byMonthDays : [start.getDate()];

  const results: DayjsTZDate[] = [];
  let generated = 0;

  // 计算需要遍历的月份范围
  const startMonth = rangeStart.getFullYear() * 12 + rangeStart.getMonth();
  const endMonth = effectiveEnd.getFullYear() * 12 + effectiveEnd.getMonth();
  const totalMonths = endMonth - startMonth + 1;

  for (let i = 0; i <= totalMonths; i += interval) {
    if (count && generated >= count) break;

    const baseMonthIdx = startMonth + i;
    const y = Math.floor(baseMonthIdx / 12);
    const m = baseMonthIdx % 12;

    for (const md of monthDays) {
      if (count && generated >= count) break;

      // 获取该月实际天数
      const lastDay = new DayjsTZDate(y, m + 1, 0).getDate();
      const day = Math.min(md, lastDay);
      const candidate = new DayjsTZDate(y, m, day);

      if (candidate.getTime() < start.getTime()) continue;
      if (candidate.getTime() > effectiveEnd.getTime()) break;

      if (dateInRange(candidate, rangeStart, effectiveEnd)) {
        if (!results.some((d) => sameDate(d, candidate))) {
          results.push(candidate);
          generated++;
        }
      }
    }
  }

  return results;
}

function expandYearly(
  start: DayjsTZDate,
  interval: number,
  rangeStart: DayjsTZDate,
  rangeEnd: DayjsTZDate,
  effectiveEnd: DayjsTZDate,
  count?: number
): DayjsTZDate[] {
  const results: DayjsTZDate[] = [];
  let cursor = new DayjsTZDate(start);
  let generated = 0;
  const maxIter = 500; // 安全上限

  for (let i = 0; i < maxIter; i++) {
    if (count && generated >= count) break;
    if (cursor.getTime() > effectiveEnd.getTime()) break;

    if (dateInRange(cursor, rangeStart, effectiveEnd)) {
      results.push(new DayjsTZDate(cursor));
      generated++;
    }

    cursor = cursor.addFullYear(interval);
  }

  return results;
}
