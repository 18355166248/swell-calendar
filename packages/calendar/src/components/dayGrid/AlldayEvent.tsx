import type { CSSProperties } from 'react';
import { EventUIModel } from '@/model/eventUIModel';
import { cls } from '@/helpers/css';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';

interface AlldayEventProps {
  uiModel: EventUIModel;
  height: number;
}

export function AlldayEvent({ uiModel, height }: AlldayEventProps) {
  const { model, left, width, exceedLeft, exceedRight } = uiModel;
  const callbacks = useCalendarCallbacks();

  const style: CSSProperties = {
    position: 'absolute',
    left: `${left}%`,
    width: `calc(${width}% - 4px)`,
    top: uiModel.top * height,
    height: height - 2,
    backgroundColor: model.backgroundColor ?? '#1677ff',
    color: model.color ?? '#fff',
    borderRadius: 3,
    padding: '0 4px',
    fontSize: 12,
    lineHeight: `${height - 2}px`,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  return (
    <div
      className={cls('allday-event')}
      style={style}
      title={model.title}
      onClick={() => callbacks?.onEventClick?.({ event: model.toEventObject() })}
    >
      {exceedLeft && <span style={{ marginRight: 2 }}>&#8249;</span>}
      {model.title}
      {exceedRight && <span style={{ marginLeft: 2 }}>&#8250;</span>}
    </div>
  );
}
