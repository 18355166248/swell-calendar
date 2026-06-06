import { GridSelectionType } from './gridSelection.type';

export type GridSelectionDraggingType = `gridSelection/${GridSelectionType}`;

export type DraggingTypes<EventId extends string = string> =
  | GridSelectionDraggingType
  | EventDragging<EventId>;

export type EventDraggingArea = 'dayGrid' | 'timeGrid';

export type EventDraggingBehavior = 'move' | 'resize';

/** resize 的拖拽方向：'start' 拖顶边改开始时间，'end' 拖底边改结束时间 */
export type EventResizeDirection = 'start' | 'end';

export type EventDragging<EventId extends string = string> =
  | `event/${EventDraggingArea}/move/${EventId}`
  | `event/${EventDraggingArea}/resize/${EventId}`
  | `event/${EventDraggingArea}/resize/${EventResizeDirection}/${EventId}`;
