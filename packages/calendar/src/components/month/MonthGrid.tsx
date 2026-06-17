import { useCallback, useMemo, useRef, useState } from 'react';

import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import { MonthWeekEventData } from '@/controller/month.controller';
import {
  buildCreatedMonthEvent,
  computeMovedMonthEvent,
  computeResizedMonthEvent,
  getMonthGridPositionFromPoint,
  splitFlatRangeIntoWeekSegments,
} from '@/controller/month-interaction';
import { shouldAcceptMonthEventChange } from '@/controller/month-validation';
import { cls } from '@/helpers/css';
import { useMonthCreate } from '@/hooks/month/useMonthCreate';
import { EventUIModel } from '@/model/eventUIModel';
import { toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from '@/types/events.type';

import { MonthEvent } from './MonthEvent';
import {
  MonthDragPreview,
  MonthInteractionProvider,
  MonthInteractionValue,
} from './MonthInteractionContext';

const CELL_EVENT_HEIGHT = 22;
const CELL_HEADER_HEIGHT = 28;

interface MonthGridProps {
  weeks: DayjsTZDate[][];
  eventRows: MonthWeekEventData[];
  renderDate: DayjsTZDate;
  visibleEventCount: number;
  /** 每周的列数，默认为 7（周日—周六） */
  totalCols?: number;
}

function isSameDay(a: DayjsTZDate, b: DayjsTZDate) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: DayjsTZDate) {
  return isSameDay(date, new DayjsTZDate());
}

function isCurrentMonth(date: DayjsTZDate, renderDate: DayjsTZDate) {
  return (
    date.getFullYear() === renderDate.getFullYear() && date.getMonth() === renderDate.getMonth()
  );
}

export function MonthGrid({
  weeks,
  eventRows,
  renderDate,
  visibleEventCount,
  totalCols = 7,
}: MonthGridProps) {
  const weekCount = weeks.length;
  const rowHeightPercent = 100 / weekCount;

  const options = useCalendarStore((state) => state.options);
  const callbacks = useCalendarCallbacks();
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragPreview, setDragPreview] = useState<MonthDragPreview | null>(null);

  const gridPositionFinder = useCallback(
    (clientX: number, clientY: number) => {
      const container = gridRef.current;
      if (!container) {
        return null;
      }
      const rect = container.getBoundingClientRect();
      return getMonthGridPositionFromPoint({
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        width: rect.width,
        height: rect.height,
        weekCount,
        colCount: totalCols,
      });
    },
    [weekCount, totalCols]
  );

  const commitMove = useCallback(
    (uiModel: EventUIModel, dayDelta: number) => {
      const prev = uiModel.model.toEventObject();
      const next = computeMovedMonthEvent(prev, dayDelta);
      const accepted = shouldAcceptMonthEventChange(options, callbacks, {
        action: 'move',
        event: next,
        previousEvent: prev as EventObjectWithDefaultValues,
      });
      if (!accepted) {
        return;
      }
      callbacks?.onEventUpdate?.({
        event: next,
        previousEvent: prev as EventObjectWithDefaultValues,
      });
    },
    [options, callbacks]
  );

  const commitResize = useCallback(
    (uiModel: EventUIModel, edge: 'start' | 'end', dayDelta: number) => {
      const prev = uiModel.model.toEventObject();
      const next = computeResizedMonthEvent(prev, edge, dayDelta);
      const accepted = shouldAcceptMonthEventChange(options, callbacks, {
        action: 'resize',
        event: next,
        previousEvent: prev as EventObjectWithDefaultValues,
      });
      if (!accepted) {
        return;
      }
      callbacks?.onEventUpdate?.({
        event: next,
        previousEvent: prev as EventObjectWithDefaultValues,
      });
    },
    [options, callbacks]
  );

  const flatToDate = useCallback(
    (flatOffset: number): DayjsTZDate | null => {
      const weekIndex = Math.floor(flatOffset / totalCols);
      const colIndex = flatOffset % totalCols;
      return weeks[weekIndex]?.[colIndex] ?? null;
    },
    [weeks, totalCols]
  );

  const commitCreate = useCallback(
    (startFlat: number, endFlat: number) => {
      const startDate = flatToDate(startFlat);
      const endDate = flatToDate(endFlat);
      if (!startDate || !endDate) {
        return;
      }
      const next = buildCreatedMonthEvent(startDate, endDate);
      const accepted = shouldAcceptMonthEventChange(options, callbacks, {
        action: 'create',
        event: next,
      });
      if (!accepted) {
        return;
      }
      callbacks?.onEventCreate?.({ event: next });
    },
    [flatToDate, options, callbacks]
  );

  const onCreateStart = useMonthCreate({
    gridPositionFinder,
    setDragPreview,
    commitCreate,
  });

  const interactionValue = useMemo<MonthInteractionValue>(
    () => ({
      weekCount,
      colCount: totalCols,
      gridPositionFinder,
      setDragPreview,
      commitMove,
      commitResize,
    }),
    [weekCount, totalCols, gridPositionFinder, commitMove, commitResize]
  );

  const ghostSegments = useMemo(
    () =>
      dragPreview
        ? splitFlatRangeIntoWeekSegments(
            dragPreview.startFlat,
            dragPreview.endFlat,
            weekCount,
            totalCols
          )
        : [],
    [dragPreview, weekCount, totalCols]
  );

  return (
    <MonthInteractionProvider value={interactionValue}>
      <div className={cls('month-grid')} ref={gridRef}>
        {weeks.map((week, weekIndex) => {
          const { rows, overflowByCol } = eventRows[weekIndex] ?? { rows: [], overflowByCol: [] };
          // 把拖拽预览的压平区间切到当前周，跨周时每周各渲染一段
          const ghost = dragPreview
            ? ghostSegments.find((seg) => seg.weekIndex === weekIndex) ?? null
            : null;
          const weekStart = toStartOfDay(week[0]);
          const weekEnd = toEndOfDay(week[week.length - 1]);

          return (
            <div
              key={weekIndex}
              className={cls('month-week-row')}
              style={{ height: `${rowHeightPercent}%` }}
              onMouseDown={onCreateStart}
            >
              {week.map((date, colIndex) => {
                const today = isToday(date);
                const currentMonth = isCurrentMonth(date, renderDate);
                const overflow = overflowByCol[colIndex] ?? 0;

                return (
                  <div
                    key={colIndex}
                    className={cls('month-cell', {
                      'month-cell-today': today,
                      'month-cell-other-month': !currentMonth,
                    })}
                  >
                    <div className={cls('month-cell-header')}>
                      <span className={cls('month-cell-date', { 'month-cell-date-today': today })}>
                        {date.getDate()}
                      </span>
                    </div>
                    {overflow > 0 && (
                      <div
                        className={cls('month-more')}
                        style={{ top: CELL_HEADER_HEIGHT + visibleEventCount * CELL_EVENT_HEIGHT }}
                      >
                        +{overflow} 更多
                      </div>
                    )}
                  </div>
                );
              })}

              <div className={cls('month-event-layer')}>
                {rows.map(({ uiModel, startCol, colspan, slotIndex }, i) => (
                  <MonthEvent
                    key={i}
                    uiModel={uiModel}
                    startCol={startCol}
                    colspan={colspan}
                    slotIndex={slotIndex}
                    cellEventHeight={CELL_EVENT_HEIGHT}
                    cellHeaderHeight={CELL_HEADER_HEIGHT}
                    totalCols={totalCols}
                    weekIndex={weekIndex}
                    canResizeStartHandle={
                      uiModel.getStarts().getTime() >= weekStart.getTime() &&
                      uiModel.getStarts().getTime() <= weekEnd.getTime()
                    }
                    canResizeEndHandle={
                      uiModel.getEnds().getTime() >= weekStart.getTime() &&
                      uiModel.getEnds().getTime() <= weekEnd.getTime()
                    }
                  />
                ))}

                {ghost && (
                  <div
                    className={cls('month-event-ghost')}
                    style={{
                      position: 'absolute',
                      left: `${(ghost.startCol / totalCols) * 100}%`,
                      width: `calc(${(ghost.colspan / totalCols) * 100}% - 4px)`,
                      top: CELL_HEADER_HEIGHT,
                      height: CELL_EVENT_HEIGHT - 2,
                      borderRadius: 3,
                      border: '1px dashed #1677ff',
                      background: 'rgba(22,119,255,0.12)',
                      pointerEvents: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </MonthInteractionProvider>
  );
}
