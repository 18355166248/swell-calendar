import { createContext, useContext } from 'react';

import { EventUIModel } from '@/model/eventUIModel';

export interface TimelineDragPreview {
  resourceIndex: number;
  startDayIndex: number;
  endDayIndex: number;
  kind: 'move' | 'resize' | 'create';
  /** 光标位置，供 tooltip 跟随 */
  cursorX: number;
  cursorY: number;
}

export interface TimelineGridPosition {
  dayIndex: number;
  resourceIndex: number;
}

export interface TimelineInteractionValue {
  cellWidth: number;
  dayCount: number;
  /** 由 client 坐标求网格内 { dayIndex, resourceIndex }，越界返回 null */
  gridPositionFinder: (clientX: number, clientY: number) => TimelineGridPosition | null;
  /** 更新拖拽预览（幽灵横条 + tooltip），null 清除 */
  setDragPreview: (preview: TimelineDragPreview | null) => void;
  /** 提交移动：按天平移 + 可选跨资源行 */
  commitMove: (uiModel: EventUIModel, dayDelta: number, targetResourceIndex: number) => void;
  /** 提交 resize：拖起/止边改天 */
  commitResize: (uiModel: EventUIModel, edge: 'start' | 'end', dayDelta: number) => void;
  /** 提交创建：资源行上的天范围 → 跨天全天事件 */
  commitCreate: (resourceIndex: number, startDayIndex: number, endDayIndex: number) => void;
}

const TimelineInteractionContext = createContext<TimelineInteractionValue | null>(null);

export const TimelineInteractionProvider = TimelineInteractionContext.Provider;

export function useTimelineInteraction(): TimelineInteractionValue {
  const value = useContext(TimelineInteractionContext);
  if (!value) {
    throw new Error('useTimelineInteraction 必须在 TimelineInteractionProvider 内使用');
  }
  return value;
}
