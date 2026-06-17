import { createContext, useContext } from 'react';

import { EventUIModel } from '@/model/eventUIModel';

export interface MonthDragPreview {
  /** 落点周行索引 */
  weekIndex: number;
  /** 落点起始列 */
  startCol: number;
  /** 跨列数（clamp 在所在周内） */
  colspan: number;
  kind: 'move' | 'resize' | 'create';
  /** 光标位置，供 tooltip 跟随（首版可不渲染 tooltip） */
  cursorX: number;
  cursorY: number;
}

export interface MonthGridPositionResult {
  weekIndex: number;
  colIndex: number;
  flatOffset: number;
}

export interface MonthInteractionValue {
  weekCount: number;
  colCount: number;
  /** 由 client 坐标求 { weekIndex, colIndex, flatOffset }，容器缺失返回 null */
  gridPositionFinder: (clientX: number, clientY: number) => MonthGridPositionResult | null;
  /** 更新拖拽预览（幽灵条），null 清除 */
  setDragPreview: (preview: MonthDragPreview | null) => void;
  /** 提交移动：按天平移 dayDelta 天 */
  commitMove: (uiModel: EventUIModel, dayDelta: number) => void;
  /** 提交 resize：调整 start / end 一侧的日期 */
  commitResize: (uiModel: EventUIModel, edge: 'start' | 'end', dayDelta: number) => void;
}

const MonthInteractionContext = createContext<MonthInteractionValue | null>(null);

export const MonthInteractionProvider = MonthInteractionContext.Provider;

export function useMonthInteraction(): MonthInteractionValue {
  const value = useContext(MonthInteractionContext);
  if (!value) {
    throw new Error('useMonthInteraction 必须在 MonthInteractionProvider 内使用');
  }
  return value;
}
