import { useCallback, useMemo, useRef, useState } from 'react';

import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import { MonthWeekEventData } from '@/controller/month.controller';
import {
  buildCreatedMonthEvent,
  computeMovedMonthEvent,
  computeResizedMonthEvent,
  getMonthColumnSpanStyle,
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
  /** 每列宽度百分比（来自 getRowStyleInfo），用于 narrowWeekend 不等列宽对齐 */
  colWidths?: number[];
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
  colWidths,
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
        colWidths,
      });
    },
    [weekCount, totalCols, colWidths]
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

  const handleMoreClick = useCallback(
    (date: DayjsTZDate, overflowModels: EventUIModel[]) => {
      if (!callbacks?.onMoreEventsClick || overflowModels.length === 0) {
        return;
      }
      callbacks.onMoreEventsClick({
        date,
        events: overflowModels.map((m) => m.model.toEventObject()),
      });
    },
    [callbacks]
  );

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
          const { rows, overflowByCol, overflowEventsByCol } = eventRows[weekIndex] ?? {
            rows: [],
            overflowByCol: [],
            overflowEventsByCol: [],
          };
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

                return (
                  <div
                    key={colIndex}
                    className={cls('month-cell', {
                      'month-cell-today': today,
                      'month-cell-other-month': !currentMonth,
                    })}
                    style={colWidths ? { flex: `0 0 ${colWidths[colIndex]}%` } : undefined}
                  >
                    <div className={cls('month-cell-header')}>
                      <span className={cls('month-cell-date', { 'month-cell-date-today': today })}>
                        {date.getDate()}
                      </span>
                    </div>
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
                    colWidths={colWidths}
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

                {ghost &&
                  (() => {
                    const { leftPercent, widthPercent } = getMonthColumnSpanStyle({
                      startCol: ghost.startCol,
                      colspan: ghost.colspan,
                      colCount: totalCols,
                      colWidths,
                    });
                    return (
                      <div
                        className={cls('month-event-ghost')}
                        style={{
                          position: 'absolute',
                          left: `${leftPercent}%`,
                          width: `calc(${widthPercent}% - 4px)`,
                          top: CELL_HEADER_HEIGHT,
                          height: CELL_EVENT_HEIGHT - 2,
                          borderRadius: 3,
                          border: '1px dashed #1677ff',
                          background: 'rgba(22,119,255,0.12)',
                          pointerEvents: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    );
                  })()}

                {overflowByCol.map((overflow, colIndex) => {
                  if (overflow <= 0) return null;
                  const overflowModels = overflowEventsByCol[colIndex] ?? [];
                  const date = week[colIndex];
                  const leftPercent = colWidths
                    ? colWidths.slice(0, colIndex).reduce((a, b) => a + b, 0)
                    : (colIndex / totalCols) * 100;
                  const widthPercent = colWidths ? colWidths[colIndex] : 100 / totalCols;
                  return (
                    <div
                      key={`more-${colIndex}`}
                      className={cls('month-more')}
                      role="button"
                      tabIndex={0}
                      style={{
                        top: CELL_HEADER_HEIGHT + visibleEventCount * CELL_EVENT_HEIGHT,
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoreClick(date, overflowModels);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMoreClick(date, overflowModels);
                        }
                      }}
                    >
                      +{overflow} 更多
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </MonthInteractionProvider>
  );
}
