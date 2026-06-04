import { GridSelectionType } from './gridSelection.type';

export type GridSelectionDraggingType = `gridSelection/${GridSelectionType}`;

export type DraggingTypes<EventId extends string = string> =
  | GridSelectionDraggingType
  | EventDragging<EventId>;

export type EventDraggingArea = 'dayGrid' | 'timeGrid';

export type EventDraggingBehavior = 'move' | 'resize';

export type EventDragging<EventId extends string = string> =
  `event/${EventDraggingArea}/${EventDraggingBehavior}/${EventId}`;
