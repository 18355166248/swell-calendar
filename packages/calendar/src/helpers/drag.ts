import { EventDragging, EventDraggingArea, EventResizeDirection } from '@/types/drag.type';
import { GridSelectionType } from '@/types/gridSelection.type';

export const DRAGGING_TYPE_CREATE = {
  // direction 可选：'start' 拖顶边 / 'end' 拖底边；不传则为无方向的兼容形态
  resizeEvent: (area: EventDraggingArea, id: string, direction?: EventResizeDirection) =>
    (direction
      ? `event/${area}/resize/${direction}/${id}`
      : `event/${area}/resize/${id}`) as EventDragging,
  moveEvent: (area: EventDraggingArea, id: string) => `event/${area}/move/${id}` as const,
  gridSelection: (type: GridSelectionType) => `gridSelection/${type}` as const,
};
