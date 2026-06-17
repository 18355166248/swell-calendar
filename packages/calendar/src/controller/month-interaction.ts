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
