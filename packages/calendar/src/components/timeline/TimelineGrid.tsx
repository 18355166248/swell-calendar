import { useCallback, useMemo, useRef, useState } from 'react';

import { TIMELINE_EVENT_HEIGHT, TIMELINE_ROW_PADDING_Y } from '@/constants/timeline-const';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import {
  buildCreatedAlldayEvent,
  CalendarTimelineRow,
  computeMovedEvent,
  computeResizedEvent,
  getTimelineDayIndexFromX,
  getTimelineResourceIndexFromY,
} from '@/controller/timeline-calendar';
import { shouldAcceptTimelineEventChange } from '@/controller/timeline-validation';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';
import { isWeekend } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject, EventObjectWithDefaultValues } from '@/types/events.type';

import { TimelineDragTooltip } from './TimelineDragTooltip';
import {
  TimelineDragPreview,
  TimelineInteractionProvider,
  TimelineInteractionValue,
} from './TimelineInteractionContext';
import { TimelineRow } from './TimelineRow';

interface TimelineGridProps {
  rows: CalendarTimelineRow[];
  days: DayjsTZDate[];
  rowHeights: number[];
  cellWidth: number;
  todayIndex: number;
}

export function TimelineGrid({ rows, days, rowHeights, cellWidth, todayIndex }: TimelineGridProps) {
  const totalWidth = days.length * cellWidth;
  const dayCount = days.length;

  const { options } = useCalendarStore();
  const callbacks = useCalendarCallbacks();

  const gridRef = useRef<HTMLDivElement>(null);
  const [dragPreview, setDragPreview] = useState<TimelineDragPreview | null>(null);

  // 每行顶部累加偏移，用于幽灵横条定位
  const rowTops = useMemo(() => {
    const tops: number[] = [];
    let acc = 0;
    rowHeights.forEach((h) => {
      tops.push(acc);
      acc += h;
    });
    return tops;
  }, [rowHeights]);

  const gridPositionFinder = useCallback(
    (clientX: number, clientY: number) => {
      const container = gridRef.current;
      if (!container) {
        return null;
      }
      const rect = container.getBoundingClientRect();
      const dayIndex = getTimelineDayIndexFromX(clientX - rect.left, cellWidth, dayCount);
      const resourceIndex = getTimelineResourceIndexFromY(clientY - rect.top, rowHeights);
      return { dayIndex, resourceIndex };
    },
    [cellWidth, dayCount, rowHeights]
  );

  const acceptAndDispatch = useCallback(
    (
      action: 'move' | 'resize' | 'create',
      next: EventObject,
      previous?: EventObjectWithDefaultValues
    ) => {
      const accepted = shouldAcceptTimelineEventChange(options, callbacks, {
        action,
        event: next,
        previousEvent: previous,
      });
      if (!accepted) {
        return;
      }
      if (action === 'create') {
        callbacks?.onEventCreate?.({ event: next });
      } else {
        callbacks?.onEventUpdate?.({ event: next, previousEvent: previous! });
      }
    },
    [options, callbacks]
  );

  const commitMove = useCallback(
    (uiModel: EventUIModel, dayDelta: number, targetResourceIndex: number) => {
      const prev = uiModel.model.toEventObject();
      const targetResourceId = rows[targetResourceIndex]?.resourceId;
      const changedResource =
        targetResourceId && targetResourceId !== prev.resourceId ? targetResourceId : undefined;
      const next = computeMovedEvent(prev, dayDelta, changedResource);
      acceptAndDispatch('move', next, prev as EventObjectWithDefaultValues);
    },
    [rows, acceptAndDispatch]
  );

  const commitResize = useCallback(
    (uiModel: EventUIModel, edge: 'start' | 'end', dayDelta: number) => {
      const prev = uiModel.model.toEventObject();
      const next = computeResizedEvent(prev, edge, dayDelta);
      acceptAndDispatch('resize', next, prev as EventObjectWithDefaultValues);
    },
    [acceptAndDispatch]
  );

  const commitCreate = useCallback(
    (resourceIndex: number, startDayIndex: number, endDayIndex: number) => {
      const resourceId = rows[resourceIndex]?.resourceId;
      if (!resourceId) {
        return;
      }
      const next = buildCreatedAlldayEvent(resourceId, days[startDayIndex], days[endDayIndex]);
      acceptAndDispatch('create', next);
    },
    [rows, days, acceptAndDispatch]
  );

  const interactionValue = useMemo<TimelineInteractionValue>(
    () => ({
      cellWidth,
      dayCount,
      gridPositionFinder,
      setDragPreview,
      commitMove,
      commitResize,
      commitCreate,
    }),
    [cellWidth, dayCount, gridPositionFinder, commitMove, commitResize, commitCreate]
  );

  const ghost = useMemo(() => {
    if (!dragPreview) {
      return null;
    }
    const { resourceIndex, startDayIndex, endDayIndex } = dragPreview;
    const top = (rowTops[resourceIndex] ?? 0) + TIMELINE_ROW_PADDING_Y;
    const left = startDayIndex * cellWidth + 1;
    const width = (endDayIndex - startDayIndex + 1) * cellWidth - 2;
    return { top, left, width };
  }, [dragPreview, rowTops, cellWidth]);

  const tooltipText = useMemo(() => {
    if (!dragPreview) {
      return null;
    }
    const fmt = (i: number) => {
      const d = days[i]?.dayjs;
      return d ? `${d.month() + 1}/${d.date()}` : '';
    };
    return `${fmt(dragPreview.startDayIndex)} – ${fmt(dragPreview.endDayIndex)}`;
  }, [dragPreview, days]);

  return (
    <TimelineInteractionProvider value={interactionValue}>
      <div className={cls('timeline-grid')} style={{ width: totalWidth }} ref={gridRef}>
        {rows.map((row, rowIndex) => (
          <TimelineRow
            key={row.resourceId}
            row={row}
            rowIndex={rowIndex}
            days={days}
            cellWidth={cellWidth}
            rowHeight={rowHeights[rowIndex]}
            todayIndex={todayIndex}
            isWeekendDay={(day) => isWeekend(day.dayjs.day())}
          />
        ))}

        {ghost && (
          <div
            className={cls('timeline-drag-ghost')}
            style={{
              top: ghost.top,
              left: ghost.left,
              width: ghost.width,
              height: TIMELINE_EVENT_HEIGHT,
            }}
          />
        )}
      </div>

      {dragPreview && tooltipText && (
        <TimelineDragTooltip text={tooltipText} x={dragPreview.cursorX} y={dragPreview.cursorY} />
      )}
    </TimelineInteractionProvider>
  );
}
