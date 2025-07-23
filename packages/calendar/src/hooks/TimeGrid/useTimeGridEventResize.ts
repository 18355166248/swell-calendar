import { ResizingEventShadowProps } from '@/components/timeGrid/ResizingEventShadow';
import { useDraggingEvent } from '../event/useDraggingEvent';
import { useCurrentPointerPositionInGrid } from '../event/useCurrentPointerPositionInGrid';

export function useTimeGridEventResize({
  gridPositionFinder,
  timeGridData,
  columnIndex,
  totalUIModels,
}: ResizingEventShadowProps) {
  // 获取拖拽事件状态，包括是否正在拖拽、是否取消、拖拽事件对象和清理函数
  const {
    isDraggingEnd,
    isDraggingCanceled,
    draggingEvent: resizingStartUIModel,
    clearDraggingEvent,
  } = useDraggingEvent('timeGrid', 'resize');
  // 获取当前指针在网格中的位置，返回位置信息和清理函数
  const [currentGridPos, clearCurrentGridPos] = useCurrentPointerPositionInGrid(gridPositionFinder);

  return {
    resizingEvent: null,
  };
}
