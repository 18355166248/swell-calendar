import { toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';

/**
 * 月视图日粒度拖拽的纯函数：命中测试 + 事件改写。
 *
 * 月视图是 Timeline 的二维版本（周行 × 日列，事件为跨天全天条）。
 * 与 `timeline-calendar.ts` 刻意解耦，避免月视图耦合资源行语义。
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface MonthGridPosition {
  /** 周行索引（0-based） */
  weekIndex: number;
  /** 日列索引（0-based） */
  colIndex: number;
  /** 压平到「自网格首日起第几天」：weekIndex * colCount + colIndex */
  flatOffset: number;
}

/** 拖拽预览的压平日区间（含两端） */
export interface MonthFlatRange {
  startFlat: number;
  endFlat: number;
}

/** 压平区间切到某一周后的段（用于幽灵条逐周渲染） */
export interface MonthWeekSegment {
  weekIndex: number;
  startCol: number;
  colspan: number;
}

/**
 * 把压平日区间 [startFlat, endFlat] 按周切分为多段。
 *
 * 月视图事件跨周时在每个所在周各占一段，本函数即「换行」渲染的核心：
 * 同周返回单段，跨周返回每周一段（首/尾段可能不满整周）。
 */
export function splitFlatRangeIntoWeekSegments(
  startFlat: number,
  endFlat: number,
  weekCount: number,
  colCount: number
): MonthWeekSegment[] {
  if (colCount <= 0 || weekCount <= 0 || endFlat < startFlat) {
    return [];
  }
  const lastCell = weekCount * colCount - 1;
  const from = clamp(startFlat, 0, lastCell);
  const to = clamp(endFlat, 0, lastCell);
  const firstWeek = Math.floor(from / colCount);
  const lastWeek = Math.floor(to / colCount);

  const segments: MonthWeekSegment[] = [];
  for (let weekIndex = firstWeek; weekIndex <= lastWeek; weekIndex++) {
    const weekStartFlat = weekIndex * colCount;
    const weekEndFlat = weekStartFlat + colCount - 1;
    const segStart = Math.max(from, weekStartFlat);
    const segEnd = Math.min(to, weekEndFlat);
    segments.push({
      weekIndex,
      startCol: segStart - weekStartFlat,
      colspan: segEnd - segStart + 1,
    });
  }
  return segments;
}

/**
 * move 预览区间：整段按 dayDelta 平移，保持跨度、允许跨周换行；
 * 整段被夹紧在网格内（首尾不越界）。
 */
export function computeMovePreviewRange({
  weekIndex,
  startCol,
  colspan,
  dayDelta,
  weekCount,
  colCount,
}: {
  weekIndex: number;
  startCol: number;
  colspan: number;
  dayDelta: number;
  weekCount: number;
  colCount: number;
}): MonthFlatRange {
  const lastCell = weekCount * colCount - 1;
  const srcFlat = weekIndex * colCount + startCol;
  const span = clamp(colspan, 1, weekCount * colCount);
  const nextStartFlat = clamp(srcFlat + dayDelta, 0, lastCell - (span - 1));
  return { startFlat: nextStartFlat, endFlat: nextStartFlat + span - 1 };
}

/**
 * resize 预览区间：仅动一侧边界。
 * - edge==='start'：start 向后不越过 end，向前夹紧到 0
 * - edge==='end'：end 向前不越过 start，向后夹紧到末格
 */
export function computeResizePreviewRange({
  weekIndex,
  startCol,
  colspan,
  edge,
  dayDelta,
  weekCount,
  colCount,
}: {
  weekIndex: number;
  startCol: number;
  colspan: number;
  edge: 'start' | 'end';
  dayDelta: number;
  weekCount: number;
  colCount: number;
}): MonthFlatRange {
  const lastCell = weekCount * colCount - 1;
  const srcStartFlat = weekIndex * colCount + startCol;
  const srcEndFlat = srcStartFlat + colspan - 1;

  if (edge === 'start') {
    return { startFlat: clamp(srcStartFlat + dayDelta, 0, srcEndFlat), endFlat: srcEndFlat };
  }
  return { startFlat: srcStartFlat, endFlat: clamp(srcEndFlat + dayDelta, srcStartFlat, lastCell) };
}

/**
 * 由网格内偏移坐标求 { weekIndex, colIndex, flatOffset }。
 *
 * 首版按等宽近似（width/colCount、height/weekCount）；narrowWeekend
 * 默认关闭，开启后的不等列宽精确命中留待后续增量（见任务文档风险项）。
 */
export function getMonthGridPositionFromPoint({
  offsetX,
  offsetY,
  width,
  height,
  weekCount,
  colCount,
}: {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  weekCount: number;
  colCount: number;
}): MonthGridPosition {
  if (colCount <= 0 || weekCount <= 0 || width <= 0 || height <= 0) {
    return { weekIndex: 0, colIndex: 0, flatOffset: 0 };
  }
  const colWidth = width / colCount;
  const rowHeight = height / weekCount;
  const colIndex = clamp(Math.floor(offsetX / colWidth), 0, colCount - 1);
  const weekIndex = clamp(Math.floor(offsetY / rowHeight), 0, weekCount - 1);
  return { weekIndex, colIndex, flatOffset: weekIndex * colCount + colIndex };
}

/**
 * 按天平移事件：start/end 各 +dayDelta 天，保留 time-of-day 与跨天天数。
 */
export function computeMovedMonthEvent(prev: EventObject, dayDelta: number): EventObject {
  const start = new DayjsTZDate(prev.start).addDate(dayDelta);
  const end = new DayjsTZDate(prev.end).addDate(dayDelta);
  return { ...prev, start, end };
}

/**
 * 按天调整事件边界：仅改一侧日期，保留另一侧与 time-of-day。
 *
 * 月视图 resize 是日粒度操作，因此最小跨度收敛为「不允许 start 晚于 end」：
 * - 拖 start 超过 end：夹紧到 end 当天
 * - 拖 end 早于 start：夹紧到 start 当天
 */
export function computeResizedMonthEvent(
  prev: EventObject,
  edge: 'start' | 'end',
  dayDelta: number
): EventObject {
  const prevStart = new DayjsTZDate(prev.start);
  const prevEnd = new DayjsTZDate(prev.end);

  if (edge === 'start') {
    const nextStart = prevStart.addDate(dayDelta);
    return {
      ...prev,
      start: nextStart.getTime() <= prevEnd.getTime() ? nextStart : prevEnd,
      end: prevEnd,
    };
  }

  const nextEnd = prevEnd.addDate(dayDelta);
  return {
    ...prev,
    start: prevStart,
    end: nextEnd.getTime() >= prevStart.getTime() ? nextEnd : prevStart,
  };
}

/**
 * 拖拽创建：在空白日期格子横向框选 [startDay, endDay] → 跨天全天事件。
 *
 * start = 首日 00:00，end = 末日 23:59:59.999；自动校正起止顺序。
 * 月视图无资源行语义，因此不带 resourceId（对照 timeline 的 buildCreatedAlldayEvent）。
 */
export function buildCreatedMonthEvent(startDay: DayjsTZDate, endDay: DayjsTZDate): EventObject {
  const [first, last] =
    startDay.getTime() <= endDay.getTime() ? [startDay, endDay] : [endDay, startDay];

  return {
    allDay: true,
    category: 'allday',
    start: toStartOfDay(first),
    end: toEndOfDay(last),
  } as EventObject;
}
