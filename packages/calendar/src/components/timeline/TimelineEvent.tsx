import type { KeyboardEvent } from 'react';

import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';

interface TimelineEventProps {
  uiModel: EventUIModel;
  totalWidth: number;
}

export function TimelineEvent({ uiModel, totalWidth }: TimelineEventProps) {
  const { model } = uiModel;
  const { title, backgroundColor, color, borderColor } = model;
  const callbacks = useCalendarCallbacks();

  const leftPx = (uiModel.left / 100) * totalWidth;
  const widthPx = Math.max((uiModel.width / 100) * totalWidth, 4);

  const style = {
    position: 'absolute' as const,
    left: leftPx,
    width: widthPx,
    top: 4,
    height: 32,
    backgroundColor: backgroundColor || '#3b82f6',
    borderLeft: borderColor ? `3px solid ${borderColor}` : undefined,
    color: color || '#fff',
    borderRadius: 3,
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
    fontSize: 12,
    lineHeight: '32px',
    paddingLeft: 6,
    paddingRight: 4,
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
    zIndex: 1,
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
    callbacks?.onEventHover?.({
      event: model.toEventObject(),
      hovering: true,
    });
  };

  const handleMouseLeave = () => {
    callbacks?.onEventHover?.({
      event: model.toEventObject(),
      hovering: false,
    });
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
      {uiModel.exceedLeft && <span style={{ marginRight: 2 }}>‹</span>}
      {title}
      {uiModel.exceedRight && <span style={{ marginLeft: 2 }}>›</span>}
    </div>
  );
}
