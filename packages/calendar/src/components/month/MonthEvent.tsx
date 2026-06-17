import type { CSSProperties, KeyboardEvent } from 'react';

import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
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
  /** 当前分段是否命中事件真实开始日 */
  canResizeStartHandle: boolean;
  /** 当前分段是否命中事件真实结束日 */
  canResizeEndHandle: boolean;
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
  canResizeStartHandle,
  canResizeEndHandle,
}: MonthEventProps) {
  const { model } = uiModel;
  const callbacks = useCalendarCallbacks();
  const options = useCalendarStore((state) => state.options);
  const { onMoveStart, onResizeStartStart, onResizeEndStart } = useMonthEventDrag({
    uiModel,
    weekIndex,
    startCol,
    colspan,
  });
  const leftPercent = (startCol / totalCols) * 100;
  const widthPercent = (colspan / totalCols) * 100;
  const top = cellHeaderHeight + slotIndex * cellEventHeight;
  const canResize =
    options.isReadOnly !== true &&
    options.month?.dragToResize !== false &&
    model.editable !== false &&
    model.resizable !== false;

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

  const handleMoveStart = (e: React.MouseEvent<HTMLDivElement>) => {
    // 阻止冒泡到周行的空白创建拖拽，避免拖动事件时误触发 create
    e.stopPropagation();
    onMoveStart(e);
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, edge: 'start' | 'end') => {
    e.stopPropagation();
    if (edge === 'start') {
      onResizeStartStart(e);
      return;
    }
    onResizeEndStart(e);
  };

  return (
    <div
      className={cls('month-event')}
      style={style}
      title={model.title}
      tabIndex={0}
      role="button"
      onMouseDown={handleMoveStart}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`month-event-${model.id}`}
    >
      {model.title}

      {canResize && canResizeStartHandle && (
        <div
          className={cls('month-event-resize-handle', 'month-event-resize-handle--start')}
          data-testid={`month-resize-start-${model.id}`}
          onMouseDown={(e) => handleResizeStart(e, 'start')}
        />
      )}

      {canResize && canResizeEndHandle && (
        <div
          className={cls('month-event-resize-handle', 'month-event-resize-handle--end')}
          data-testid={`month-resize-end-${model.id}`}
          onMouseDown={(e) => handleResizeStart(e, 'end')}
        />
      )}
    </div>
  );
}
