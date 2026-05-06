import type { CSSProperties } from 'react';
import { EventUIModel } from '@/model/eventUIModel';
import { cls } from '@/helpers/css';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';

interface MonthEventProps {
  uiModel: EventUIModel;
  startCol: number;
  colspan: number;
  slotIndex: number;
  cellEventHeight: number;
  cellHeaderHeight: number;
  totalCols: number;
}

export function MonthEvent({
  uiModel,
  startCol,
  colspan,
  slotIndex,
  cellEventHeight,
  cellHeaderHeight,
  totalCols,
}: MonthEventProps) {
  const { model } = uiModel;
  const callbacks = useCalendarCallbacks();
  const leftPercent = (startCol / totalCols) * 100;
  const widthPercent = (colspan / totalCols) * 100;
  const top = cellHeaderHeight + slotIndex * cellEventHeight;

  const style: CSSProperties = {
    position: 'absolute',
    left: `${leftPercent}%`,
    width: `calc(${widthPercent}% - 4px)`,
    top,
    height: cellEventHeight - 2,
    backgroundColor: model.backgroundColor ?? model.borderColor ?? '#1677ff',
    color: model.color ?? '#fff',
    borderRadius: 3,
    padding: '0 4px',
    fontSize: 12,
    lineHeight: `${cellEventHeight - 2}px`,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  return (
    <div
      className={cls('month-event')}
      style={style}
      title={model.title}
      onClick={() => callbacks?.onEventClick?.({ event: model.toEventObject() })}
    >
      {model.title}
    </div>
  );
}
