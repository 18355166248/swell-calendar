import type { CSSProperties, KeyboardEvent } from 'react';

import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';

interface AlldayEventProps {
  uiModel: EventUIModel;
  height: number;
}

const ALLDAY_EVENT_LEFT_INSET = 1;
const ALLDAY_EVENT_RIGHT_GAP = 4;

export function AlldayEvent({ uiModel, height }: AlldayEventProps) {
  const { model, left, width, exceedLeft, exceedRight } = uiModel;
  const callbacks = useCalendarCallbacks();

  const style: CSSProperties = {
    position: 'absolute',
    left: `calc(${left}% + ${ALLDAY_EVENT_LEFT_INSET}px)`,
    width: `calc(${width}% - ${ALLDAY_EVENT_LEFT_INSET + ALLDAY_EVENT_RIGHT_GAP}px)`,
    top: uiModel.top * height,
    height: height - 2,
    backgroundColor: model.backgroundColor ?? '#1677ff',
    color: model.color ?? '#fff',
    // 默认 3px（桌面零回归），移动 tier 经 CSS 变量胶囊化（见 css/responsive.scss）
    borderRadius: 'var(--swell-allday-event-radius, 3px)',
    padding: '0 4px',
    fontSize: 12,
    lineHeight: `${height - 2}px`,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    boxSizing: 'border-box',
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

  return (
    <div
      className={cls('allday-event')}
      style={style}
      data-testid={`event-card-${model.id}`}
      title={model.title}
      tabIndex={0}
      role="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {exceedLeft && <span style={{ marginRight: 2 }}>&#8249;</span>}
      {model.title}
      {exceedRight && <span style={{ marginLeft: 2 }}>&#8250;</span>}
    </div>
  );
}
