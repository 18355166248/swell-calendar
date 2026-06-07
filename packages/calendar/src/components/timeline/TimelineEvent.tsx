import type { KeyboardEvent } from 'react';

import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';

interface TimelineEventProps {
  uiModel: EventUIModel;
  left: number;
  width: number;
  top: number;
  height: number;
  exceedLeft: boolean;
  exceedRight: boolean;
}

/** Calendar Timeline 事件横条（跨天）。 */
export function TimelineEvent({
  uiModel,
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
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerEnter={handleMouseEnter}
      onPointerLeave={handleMouseLeave}
    >
      {exceedLeft && <span className={cls('timeline-event-arrow')}>‹</span>}
      <span className={cls('timeline-event-title')}>{title}</span>
      {exceedRight && <span className={cls('timeline-event-arrow')}>›</span>}
    </div>
  );
}
