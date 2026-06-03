import { useMemo } from 'react';

import { getTimelineEvents } from '@/controller/timeline.controller';
import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { DateType } from '@/types/events.type';
import { BlockedTimeRange, ColoredRange, ResourceInfo } from '@/types/options.type';

import { TimelineEvent } from './TimelineEvent';

interface TimelineGridProps {
  resources: ResourceInfo[];
  calendar: CalendarData;
  weekDates: DayjsTZDate[];
  weekStart: DayjsTZDate;
  weekEnd: DayjsTZDate;
  hourStart: number;
  hourEnd: number;
  rowHeight: number;
  cellWidth: number;
  colors?: ColoredRange[];
  invalid?: BlockedTimeRange[];
}

/** 背景区段在压缩时间轴上的布局数据 */
interface RangeLayout {
  left: number;
  width: number;
  background?: string;
  color?: string;
  cssClass?: string;
}

/**
 * 计算单个 ColoredRange/BlockedTimeRange 在压缩时间轴中的布局。
 * 与 getTimelineEvents 使用相同的按天压缩算法。
 */
function getRangeLayout(
  range: { start: DateType; end: DateType },
  weekStartDayjs: DayjsTZDate,
  totalDays: number,
  hoursPerDay: number,
  hourStart: number,
  hourEnd: number,
  totalWidth: number
): { left: number; width: number } | null {
  const rangeStart = new DayjsTZDate(range.start);
  const rangeEnd = new DayjsTZDate(range.end);

  const weekStartDay = weekStartDayjs.dayjs.startOf('day');

  const startDayOffset = rangeStart.dayjs.startOf('day').diff(weekStartDay, 'day');
  const endDayOffset = rangeEnd.dayjs.startOf('day').diff(weekStartDay, 'day');

  const startHour = rangeStart.dayjs.hour() + rangeStart.dayjs.minute() / 60;
  const endHour = rangeEnd.dayjs.hour() + rangeEnd.dayjs.minute() / 60;

  // 计算在压缩时间轴中的位置（与 getTimelineEvents 一致）
  let startPos: number;
  if (startDayOffset < 0) {
    startPos = 0;
  } else if (startDayOffset >= totalDays) {
    return null; // 完全超出可视范围
  } else {
    const clampedStartHour = Math.max(startHour, hourStart);
    startPos = startDayOffset * hoursPerDay + (clampedStartHour - hourStart);
  }

  let endPos: number;
  if (endDayOffset < 0) {
    return null; // 完全超出可视范围
  } else if (endDayOffset >= totalDays) {
    endPos = totalDays * hoursPerDay;
  } else {
    const clampedEndHour = Math.min(endHour, hourEnd);
    endPos = endDayOffset * hoursPerDay + (clampedEndHour - hourStart);
  }

  if (endPos <= startPos) {
    return null;
  }

  const totalHours = totalDays * hoursPerDay;

  return {
    left: (Math.max(startPos, 0) / totalHours) * totalWidth,
    width: Math.max(((endPos - startPos) / totalHours) * totalWidth, 1),
  };
}

/** 判断区间是否匹配指定资源 */
function rangeMatchesResource(
  range: { resourceId?: string; resourceIds?: string[] },
  resourceId: string
): boolean {
  // 没有指定资源 → 应用到所有资源行
  if (!range.resourceId && (!range.resourceIds || range.resourceIds.length === 0)) {
    return true;
  }
  // 匹配 resourceId
  if (range.resourceId === resourceId) {
    return true;
  }
  // 匹配 resourceIds 数组
  if (range.resourceIds?.includes(resourceId)) {
    return true;
  }
  return false;
}

/**
 * 时间线网格组件 — 渲染资源行、时间格、事件和背景区段。
 */
export function TimelineGrid({
  resources,
  calendar,
  weekDates,
  weekStart,
  weekEnd,
  hourStart,
  hourEnd,
  rowHeight,
  cellWidth,
  colors = [],
  invalid = [],
}: TimelineGridProps) {
  const hoursPerDay = hourEnd - hourStart;
  const totalDays = weekEnd.dayjs.diff(weekStart.dayjs, 'day') + 1;

  const resourceEvents = useMemo(
    () =>
      resources.map((resource) =>
        getTimelineEvents(calendar, resource.id, weekStart, weekEnd, hourStart, hourEnd)
      ),
    [resources, calendar, weekStart, weekEnd, hourStart, hourEnd]
  );

  const totalWidth = weekDates.length * hoursPerDay * cellWidth;
  const weekStartDayjs = weekStart;

  // 预计算每个资源的背景区段布局
  const rowRangeLayouts = useMemo(
    () =>
      resources.map((resource) => {
        const colorLayouts: RangeLayout[] = [];
        const invalidLayouts: { left: number; width: number }[] = [];

        // 计算 colored ranges
        colors.forEach((coloredRange) => {
          if (!rangeMatchesResource(coloredRange, resource.id)) return;
          const layout = getRangeLayout(
            coloredRange,
            weekStartDayjs,
            totalDays,
            hoursPerDay,
            hourStart,
            hourEnd,
            totalWidth
          );
          if (layout) {
            colorLayouts.push({
              ...layout,
              background: coloredRange.background,
              color: coloredRange.color,
              cssClass: coloredRange.cssClass,
            });
          }
        });

        // 计算 invalid/blockedTimes
        invalid.forEach((blockedRange) => {
          if (!rangeMatchesResource(blockedRange, resource.id)) return;
          const layout = getRangeLayout(
            blockedRange,
            weekStartDayjs,
            totalDays,
            hoursPerDay,
            hourStart,
            hourEnd,
            totalWidth
          );
          if (layout) {
            invalidLayouts.push({ left: layout.left, width: layout.width });
          }
        });

        return { colorLayouts, invalidLayouts };
      }),
    [
      resources,
      colors,
      invalid,
      weekStartDayjs,
      totalDays,
      hoursPerDay,
      hourStart,
      hourEnd,
      totalWidth,
    ]
  );

  return (
    <div className={cls('timeline-grid')} style={{ width: totalWidth }}>
      {resources.map((resource, rowIndex) => (
        <div key={resource.id} className={cls('timeline-grid-row')} style={{ height: rowHeight }}>
          {/* 时间格 */}
          {weekDates.map((_, dayIndex) =>
            Array.from({ length: hoursPerDay }, (__, h) => {
              const cellIndex = dayIndex * hoursPerDay + h;
              const isLastInDay = h === hoursPerDay - 1;
              return (
                <div
                  key={cellIndex}
                  className={cls('timeline-grid-cell', {
                    'timeline-grid-cell--day-end': isLastInDay,
                  })}
                  style={{ width: cellWidth }}
                />
              );
            })
          )}

          {/* 背景色段（colors） — z-index: 0 */}
          {rowRangeLayouts[rowIndex].colorLayouts.map((layout, i) => (
            <div
              key={`color-${i}`}
              className={cls('timeline-colored-range', layout.cssClass ?? '')}
              style={{
                position: 'absolute',
                left: layout.left,
                width: layout.width,
                top: 2,
                height: rowHeight - 4,
                background: layout.background,
                color: layout.color,
                pointerEvents: 'none',
                borderRadius: 2,
                opacity: 0.45,
              }}
            />
          ))}

          {/* 禁止时段（invalid/blockedTimes） — z-index: 1 */}
          {rowRangeLayouts[rowIndex].invalidLayouts.map((layout, i) => (
            <div
              key={`invalid-${i}`}
              className={cls('timeline-blocked-range')}
              style={{
                position: 'absolute',
                left: layout.left,
                width: layout.width,
                top: 2,
                height: rowHeight - 4,
                pointerEvents: 'none',
                background:
                  'repeating-linear-gradient(-45deg, rgba(148,163,184,0.18), rgba(148,163,184,0.18) 6px, rgba(148,163,184,0.28) 6px, rgba(148,163,184,0.28) 12px)',
                borderRadius: 2,
              }}
            />
          ))}

          {/* 事件卡片 — z-index: 2 */}
          {resourceEvents[rowIndex].map((uiModel) => (
            <TimelineEvent key={uiModel.cid()} uiModel={uiModel} totalWidth={totalWidth} />
          ))}
        </div>
      ))}
    </div>
  );
}
