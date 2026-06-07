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

/**
 * 是否为「事件移动」拖拽类型。
 *
 * 跨实例拖拽只对 move 生效：resize（改时长）与 create（区间选择）
 * 都是实例内行为，不应被跨实例桥当作把事件拖到另一个实例。
 */
export function isMoveDraggingType(draggingItemType: string | null | undefined): boolean {
  return typeof draggingItemType === 'string' && /^event\/[^/]+\/move\//.test(draggingItemType);
}
