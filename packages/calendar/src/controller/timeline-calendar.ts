import { EventUIModel } from '@/model/eventUIModel';
import { toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';

import { convertToUIModel, getEventInDateRangeFilter } from './core.controller';

/**
 * Calendar Timeline（日粒度资源排程）布局算法。
 *
 * 对标 Mobiscroll React Timeline - Calendar timeline：
 * <https://demo.mobiscroll.com/react/timeline/calendar-timeline>
 *
 * 与旧「小时条」时间线不同：顶部轴以「天」为列，资源为行，
 * 事件渲染为跨多天的横条；同一资源行内按天范围重叠的事件纵向分车道（lane）堆叠。
 */

export interface CalendarTimelineItem {
  uiModel: EventUIModel;
  /** 事件起始所在列（0-based，已 clamp 到可视范围内） */
  startDayIndex: number;
  /** 事件结束所在列（0-based，已 clamp 到可视范围内，含端点） */
  endDayIndex: number;
  /** 纵向车道，用于同资源行内重叠事件堆叠 */
  lane: number;
  /** 事件真实起点早于可视范围（左侧被裁切） */
  exceedLeft: boolean;
  /** 事件真实终点晚于可视范围（右侧被裁切） */
  exceedRight: boolean;
}

export interface CalendarTimelineRow {
  resourceId: string;
  /** 该资源行需要的车道总数（决定行高） */
  laneCount: number;
  items: CalendarTimelineItem[];
}

/** 返回 renderDate 所在自然月的每一天（按天列的时间轴）。 */
export function getCalendarTimelineDays(renderDate: DayjsTZDate): DayjsTZDate[] {
  const monthStart = toStartOfDay(new DayjsTZDate(renderDate.dayjs.startOf('month').toDate()));
  const daysInMonth = renderDate.dayjs.daysInMonth();

  const days: DayjsTZDate[] = [];
  for (let i = 0; i < daysInMonth; i += 1) {
    days.push(monthStart.addDate(i));
  }
  return days;
}

/**
 * 车道分配：把已按起始列排序的事件放入第一条「不与其末尾事件重叠」的车道。
 * 重叠以「天范围」判定（含端点），返回每个事件的 lane 与总车道数。
 */
function assignLanes(items: Array<Omit<CalendarTimelineItem, 'lane'>>): {
  items: CalendarTimelineItem[];
  laneCount: number;
} {
  const laneEnds: number[] = []; // 每条车道当前最后一个事件的 endDayIndex
  const placed: CalendarTimelineItem[] = [];

  items.forEach((item) => {
    let lane = laneEnds.findIndex((end) => end < item.startDayIndex);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endDayIndex);
    } else {
      laneEnds[lane] = item.endDayIndex;
    }
    placed.push({ ...item, lane });
  });

  return { items: placed, laneCount: laneEnds.length };
}

/**
 * 计算单个资源行在日粒度时间轴中的事件布局。
 *
 * @param days 时间轴的天列（来自 getCalendarTimelineDays）
 */
export function getCalendarTimelineRow(
  calendar: CalendarData,
  resourceId: string,
  days: DayjsTZDate[]
): CalendarTimelineRow {
  if (days.length === 0) {
    return { resourceId, laneCount: 0, items: [] };
  }

  const rangeStart = toStartOfDay(days[0]);
  const rangeEnd = days[days.length - 1].addDate(1); // 末日的次日 0 点，半开区间右界
  const lastIndex = days.length - 1;

  const dateFilter = getEventInDateRangeFilter(rangeStart, days[lastIndex]);

  const matched = calendar.events.filter((event) => {
    if (!dateFilter(event)) {
      return false;
    }
    const ids = event.resourceIds ?? [];
    return event.resourceId === resourceId || ids.includes(resourceId);
  });

  const uiModels = convertToUIModel(matched).toArray();

  const rawItems = uiModels.map((uiModel) => {
    const start = uiModel.getStarts();
    const end = uiModel.getEnds();

    const rawStartIndex = toStartOfDay(start).dayjs.diff(rangeStart.dayjs, 'day');
    const rawEndIndex = toStartOfDay(end).dayjs.diff(rangeStart.dayjs, 'day');

    const startDayIndex = Math.min(Math.max(rawStartIndex, 0), lastIndex);
    const endDayIndex = Math.min(Math.max(rawEndIndex, 0), lastIndex);

    return {
      uiModel,
      startDayIndex,
      endDayIndex: Math.max(endDayIndex, startDayIndex),
      exceedLeft: rawStartIndex < 0,
      exceedRight: rawEndIndex > lastIndex,
    };
  });

  // 仅保留确有落入可视范围的事件（getEventInDateRangeFilter 已基本保证）
  void rangeEnd;

  rawItems.sort((a, b) => a.startDayIndex - b.startDayIndex || a.endDayIndex - b.endDayIndex);

  const { items, laneCount } = assignLanes(rawItems);

  return { resourceId, laneCount, items };
}

// ─── 交互几何（纯函数，供拖拽 hook 复用，可单测） ───────────────────────────────

/** 由网格内水平偏移求天列索引（clamp 到 [0, dayCount-1]）。 */
export function getTimelineDayIndexFromX(
  offsetX: number,
  cellWidth: number,
  dayCount: number
): number {
  if (dayCount <= 0 || cellWidth <= 0) {
    return 0;
  }
  const index = Math.floor(offsetX / cellWidth);
  return Math.min(Math.max(index, 0), dayCount - 1);
}

/** 由网格内垂直偏移求资源行索引（按累加行高定位，clamp 到 [0, n-1]）。 */
export function getTimelineResourceIndexFromY(offsetY: number, rowHeights: number[]): number {
  if (rowHeights.length === 0) {
    return 0;
  }
  if (offsetY < 0) {
    return 0;
  }
  let acc = 0;
  for (let i = 0; i < rowHeights.length; i += 1) {
    acc += rowHeights[i];
    if (offsetY < acc) {
      return i;
    }
  }
  return rowHeights.length - 1;
}

/**
 * 按天平移事件：start/end 各 +dayDelta 天，保留 time-of-day；
 * 提供 targetResourceId 时改资源（跨资源行移动）。
 */
export function computeMovedEvent(
  prev: EventObject,
  dayDelta: number,
  targetResourceId?: string
): EventObject {
  const start = new DayjsTZDate(prev.start).addDate(dayDelta);
  const end = new DayjsTZDate(prev.end).addDate(dayDelta);

  const next: EventObject = { ...prev, start, end };
  if (targetResourceId) {
    next.resourceId = targetResourceId;
  }
  return next;
}

/**
 * Resize：拖起始边改 start 天、拖结束边改 end 天，保留对应端点 time-of-day；
 * clamp 保证 start ≤ end（避免反向）。
 */
export function computeResizedEvent(
  prev: EventObject,
  edge: 'start' | 'end',
  dayDelta: number
): EventObject {
  if (edge === 'start') {
    let start = new DayjsTZDate(prev.start).addDate(dayDelta);
    const end = new DayjsTZDate(prev.end);
    if (start.getTime() > end.getTime()) {
      start = end;
    }
    return { ...prev, start };
  }

  let end = new DayjsTZDate(prev.end).addDate(dayDelta);
  const start = new DayjsTZDate(prev.start);
  if (end.getTime() < start.getTime()) {
    end = start;
  }
  return { ...prev, end };
}

/**
 * 拖拽创建：在资源行上横拖选中 [startDay, endDay] → 跨天全天事件。
 * start = 首日 00:00，end = 末日 23:59:59.999；自动校正起止顺序。
 */
export function buildCreatedAlldayEvent(
  resourceId: string,
  startDay: DayjsTZDate,
  endDay: DayjsTZDate
): EventObject {
  const [first, last] =
    startDay.getTime() <= endDay.getTime() ? [startDay, endDay] : [endDay, startDay];

  return {
    allDay: true,
    category: 'allday',
    start: toStartOfDay(first),
    end: toEndOfDay(last),
    resourceId,
  } as EventObject;
}
