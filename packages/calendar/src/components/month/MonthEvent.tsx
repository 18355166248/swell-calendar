import type { CSSProperties, KeyboardEvent } from 'react';

import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { cls } from '@/helpers/css';
import { useMonthEventDrag } from '@/hooks/month/useMonthEventDrag';
import { EventUIModel } from '@/model/eventUIModel';

interface MonthEventProps {
  uiModel: EventUIModel;
  startCol: number;
  colspan: number;
  slotIndex: number;
  cellEventHeight: number;
  cellHeaderHeight: number;
  totalCols: number;
  /** 事件所在周行索引，用于拖拽落点计算 */
  weekIndex: number;
}

export function MonthEvent({
  uiModel,
  startCol,
  colspan,
  slotIndex,
  cellEventHeight,
  cellHeaderHeight,
  totalCols,
  weekIndex,
}: MonthEventProps) {
  const { model } = uiModel;
  const callbacks = useCalendarCallbacks();
  const { onMoveStart } = useMonthEventDrag({ uiModel, weekIndex, startCol, colspan });
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
    opacity: 0.9,
    transition: 'opacity 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease',
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
      className={cls('month-event')}
      style={style}
      title={model.title}
      tabIndex={0}
      role="button"
      onMouseDown={onMoveStart}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`month-event-${model.id}`}
    >
      {model.title}
    </div>
  );
}
