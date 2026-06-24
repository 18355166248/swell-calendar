import type { KeyboardEvent, MouseEvent } from 'react';

import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { cls } from '@/helpers/css';
import { useTimelineEventDrag } from '@/hooks/Timeline/useTimelineEventDrag';
import { EventUIModel } from '@/model/eventUIModel';

interface TimelineEventProps {
  uiModel: EventUIModel;
  resourceIndex: number;
  startDayIndex: number;
  endDayIndex: number;
  left: number;
  width: number;
  top: number;
  height: number;
  exceedLeft: boolean;
  exceedRight: boolean;
}

/** Calendar Timeline 事件横条（跨天）：支持拖拽移动、左右 resize、点击。 */
export function TimelineEvent({
  uiModel,
  resourceIndex,
  startDayIndex,
  endDayIndex,
  left,
  width,
  top,
  height,
  exceedLeft,
  exceedRight,
}: TimelineEventProps) {
  const { model } = uiModel;
  const { title, backgroundColor, color, borderColor } = model;
  const callbacks = useCalendarCallbacks();

  const { onMoveStart, onResizeStartStart, onResizeEndStart } = useTimelineEventDrag({
    uiModel,
    resourceIndex,
    startDayIndex,
    endDayIndex,
  });

  const style = {
    position: 'absolute' as const,
    left,
    width: Math.max(width, 4),
    top,
    height,
    lineHeight: `${height}px`,
    backgroundColor: backgroundColor || '#3b82f6',
    borderLeft: borderColor ? `3px solid ${borderColor}` : undefined,
    color: color || '#fff',
  };

  const handleClick = () => {
    callbacks?.onEventClick?.({ event: model.toEventObject() });
  };

  const handleMoveStart = (e: MouseEvent) => {
    // 阻止冒泡到行（避免触发拖拽创建）
    e.stopPropagation();
    onMoveStart(e);
  };

  const handleResizeStart = (e: MouseEvent, edge: 'start' | 'end') => {
    e.stopPropagation();
    if (edge === 'start') {
      onResizeStartStart(e);
    } else {
      onResizeEndStart(e);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === KEY.ENTER || e.key === KEY.SPACE) {
      e.preventDefault();
      handleClick();
    }
  };

  const handleMouseEnter = () => {
    callbacks?.onEventHover?.({ event: model.toEventObject(), hovering: true });
  };

  const handleMouseLeave = () => {
    callbacks?.onEventHover?.({ event: model.toEventObject(), hovering: false });
  };

  return (
    <div
      className={cls('timeline-event')}
      style={style}
      title={title}
      tabIndex={0}
      role="button"
      data-testid={`timeline-event-${model.id}`}
      onPointerDown={handleMoveStart}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerEnter={handleMouseEnter}
      onPointerLeave={handleMouseLeave}
    >
      <div
        className={cls('timeline-event-resize-handle', 'timeline-event-resize-handle--start')}
        data-testid={`timeline-resize-start-${model.id}`}
        onPointerDown={(e) => handleResizeStart(e, 'start')}
      />
      {exceedLeft && <span className={cls('timeline-event-arrow')}>‹</span>}
      <span className={cls('timeline-event-title')}>{title}</span>
      {exceedRight && <span className={cls('timeline-event-arrow')}>›</span>}
      <div
        className={cls('timeline-event-resize-handle', 'timeline-event-resize-handle--end')}
        data-testid={`timeline-resize-end-${model.id}`}
        onPointerDown={(e) => handleResizeStart(e, 'end')}
      />
    </div>
  );
}
