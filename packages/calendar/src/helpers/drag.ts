import { EventDraggingArea } from '@/types/drag.type';
import { GridSelectionType } from '@/types/gridSelection.type';

export const DRAGGING_TYPE_CREATE = {
  resizeEvent: (area: EventDraggingArea, id: string) => `event/${area}/resize/${id}` as const,
  moveEvent: (area: EventDraggingArea, id: string) => `event/${area}/move/${id}` as const,
  gridSelection: (type: GridSelectionType) => `gridSelection/${type}` as const,
};
