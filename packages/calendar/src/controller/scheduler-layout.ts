import { expandSchedulerRecurrenceEvent } from '@/controller/scheduler-recurrence';
import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import { setTimeStrToDate, toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { DayGridEventMatrix, EventModelMap, TimeGridEventMatrix } from '@/types/events.type';
import { CommonGridColumn, TimeGridData } from '@/types/grid.type';
import { ColoredRange, Options, ViewType } from '@/types/options.type';
import { Panel } from '@/types/panel.type';

import { findByDateRange as findByDateRangeForWeek } from './week.controller';

/**
 * 将 scheduler 的 time events 展开 recurrence 事件
 *
 * 对每个 time event:
 * - 如果没有 recurrence, 保持原样
 * - 如果有 recurrence, 调用 expandSchedulerRecurrenceEvent 展开为多个实例
 * - 展开后的实例转为 EventUIModel 重新进入渲染链
 */
function expandSchedulerTimeEvents(
  timeEvents: EventUIModel[],
  rangeStart: DayjsTZDate,
  rangeEnd: DayjsTZDate
): EventUIModel[] {
  const result: EventUIModel[] = [];

  for (const uiModel of timeEvents) {
    const { model } = uiModel;
    const rule = model.recurrence;

    if (!rule) {
      // 非 recurrence 事件保持原样
      result.push(uiModel);
      continue;
    }

    // 有 recurrence 的事件展开为多个实例
    const expandedEvents = expandSchedulerRecurrenceEvent(
      model.toEventObject(),
      rangeStart,
      rangeEnd
    );

    for (const instanceEvent of expandedEvents) {
      const instanceModel = new EventModel(instanceEvent);
      const instanceUIModel = new EventUIModel(instanceModel);
      // 展开后的实例是独立日期事件，croppedStart/croppedEnd 由后续 splitMultiDayTimeEvents 重新计算
      // 当前先置为 false，避免原 UIModel 的裁剪信息误传到实例
      instanceUIModel.croppedStart = false;
      instanceUIModel.croppedEnd = false;
      result.push(instanceUIModel);
    }
  }

  return result;
}

function flattenSchedulerMatrix3d(eventMatrix: TimeGridEventMatrix[keyof TimeGridEventMatrix]) {
  return eventMatrix.flatMap((matrix) => matrix.flatMap((row) => row.filter(Boolean)));
}

function flattenSchedulerDayGridMatrix(eventMatrix: DayGridEventMatrix) {
  return eventMatrix.flatMap((matrix) => matrix.flatMap((row) => row.filter(Boolean)));
}

export function flattenSchedulerTimeEventMatrix(eventMatrix: TimeGridEventMatrix) {
  return Array.from(
    new Set(
      Object.values(eventMatrix).reduce<EventUIModel[]>(
        (result, matrix3d) => result.concat(flattenSchedulerMatrix3d(matrix3d)),
        []
      )
    )
  );
}

export function splitMultiDayTimeEvents(
  events: EventUIModel[],
  viewStart: DayjsTZDate,
  viewEnd: DayjsTZDate
): EventUIModel[] {
  const result: EventUIModel[] = [];

  for (const uiModel of events) {
    const { model } = uiModel;

    if (!model.hasMultiDates) {
      result.push(uiModel);
      continue;
    }

    const eventStart = model.getStarts();
    const eventEnd = model.getEnds();

    let currentDay = toStartOfDay(eventStart > viewStart ? eventStart : viewStart);

    while (currentDay <= viewEnd && currentDay <= eventEnd) {
      const dayStart = toStartOfDay(currentDay);
      const dayEnd = toEndOfDay(currentDay);

      const segStart = eventStart > dayStart ? eventStart : dayStart;
      const segEnd = eventEnd < dayEnd ? eventEnd : dayEnd;

      const segmentModel = new EventModel({
        ...model.toEventObject(),
        start: segStart,
        end: segEnd,
      });

      const segmentUIModel = new EventUIModel(segmentModel);
      segmentUIModel.croppedStart = eventStart < dayStart;
      segmentUIModel.croppedEnd = eventEnd > dayEnd;

      result.push(segmentUIModel);

      currentDay = dayStart.addDate(1);
    }
  }

  return result;
}

export function compareSchedulerEventsByOrder(a: EventUIModel, b: EventUIModel): number {
  const orderCompare = (a.model.order ?? 0) - (b.model.order ?? 0);

  if (orderCompare !== 0) {
    return orderCompare;
  }

  return a.cid() - b.cid();
}

export function sortSchedulerEventsByOrder(events: EventUIModel[]): EventUIModel[] {
  return [...events].sort(compareSchedulerEventsByOrder);
}

export function getSchedulerViewEvents(
  calendar: CalendarData,
  {
    start,
    end,
    hourStart,
    hourEnd,
  }: {
    start: DayjsTZDate;
    end: DayjsTZDate;
    hourStart: number;
    hourEnd: number;
  }
): Pick<EventModelMap, 'allday' | 'time'> {
  const panels: Panel[] = [
    {
      name: 'allday',
      type: 'daygrid',
      show: true,
    },
    {
      name: 'time',
      type: 'timegrid',
      show: true,
    },
  ];

  const eventGroups = findByDateRangeForWeek(calendar, {
    start,
    end,
    panels,
    options: {
      hourStart,
      hourEnd,
    },
  });

  const rawTimeEvents = flattenSchedulerTimeEventMatrix(eventGroups.time as TimeGridEventMatrix);

  // 展开 recurrence 事件为视口内的多个实例
  const expandedTimeEvents = expandSchedulerTimeEvents(rawTimeEvents, start, end);

  return {
    allday: flattenSchedulerDayGridMatrix(eventGroups.allday as DayGridEventMatrix),
    time: sortSchedulerEventsByOrder(splitMultiDayTimeEvents(expandedTimeEvents, start, end)),
  };
}

export interface ColoredLayout {
  top: number;
  height: number;
  background?: string;
  color?: string;
  cssClass?: string;
}

function getTimeValue(value: ColoredRange['start']) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return new Date(value).getTime();
  }

  return value.getTime();
}

function isColorMatchingColumn(coloredRange: ColoredRange, column: CommonGridColumn) {
  const matchedResourceIds = [coloredRange.resourceId, ...(coloredRange.resourceIds ?? [])].filter(
    (resourceId): resourceId is string => Boolean(resourceId)
  );

  if (matchedResourceIds.length === 0) {
    return true;
  }

  return Boolean(column.resourceId && matchedResourceIds.includes(column.resourceId));
}

function getColorsByView(options: Options, view: ViewType): ColoredRange[] {
  if (view === 'scheduler') {
    return options.scheduler?.colors ?? [];
  }

  if (view === 'timeline') {
    return options.timeline?.colors ?? [];
  }

  return [];
}

export function getColoredLayoutsForColumn(
  options: Options,
  view: ViewType,
  timeGridData: TimeGridData,
  column: CommonGridColumn
): ColoredLayout[] {
  const colors = getColorsByView(options, view);

  if (colors.length === 0) {
    return [];
  }

  const visibleStart = setTimeStrToDate(column.date, timeGridData.rows[0].startTime);
  const visibleEnd = setTimeStrToDate(
    column.date,
    timeGridData.rows[timeGridData.rows.length - 1].endTime
  );
  const visibleDuration = visibleEnd.getTime() - visibleStart.getTime();

  return colors
    .filter((coloredRange) => isColorMatchingColumn(coloredRange, column))
    .map((coloredRange): ColoredLayout | null => {
      const colorStart = getTimeValue(coloredRange.start);
      const colorEnd = getTimeValue(coloredRange.end);
      const intersectStart = Math.max(colorStart, visibleStart.getTime());
      const intersectEnd = Math.min(colorEnd, visibleEnd.getTime());

      if (intersectStart >= intersectEnd) {
        return null;
      }

      return {
        top: ((intersectStart - visibleStart.getTime()) / visibleDuration) * 100,
        height: ((intersectEnd - intersectStart) / visibleDuration) * 100,
        background: coloredRange.background,
        color: coloredRange.color,
        cssClass: coloredRange.cssClass,
      };
    })
    .filter((layout): layout is ColoredLayout => layout !== null);
}
