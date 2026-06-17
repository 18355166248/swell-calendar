import { MouseEvent, useRef } from 'react';

import {
  MonthDragPreview,
  MonthGridPositionResult,
} from '@/components/month/MonthInteractionContext';
import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';
import { useDrag } from '@/hooks/common/useDrag';

interface UseMonthCreateParams {
  /** 由 client 坐标求落点，容器缺失返回 null */
  gridPositionFinder: (clientX: number, clientY: number) => MonthGridPositionResult | null;
  /** 更新拖拽预览（幽灵条），null 清除 */
  setDragPreview: (preview: MonthDragPreview | null) => void;
  /** 提交创建：按网格压平索引区间 [startFlat, endFlat] 生成全天事件 */
  commitCreate: (startFlat: number, endFlat: number) => void;
}

/**
 * 月视图空白格横拖创建：选中 [startFlat, endFlat] → 跨天全天事件。
 *
 * 月视图是二维网格，落点用压平索引 flatOffset 表达，使创建区间在
 * 行内/跨行都是单调的线性区间。拖拽过程中显示创建预览（跨周由 MonthGrid
 * 按周切分为多段渲染），mouseup 经校验后提交 onEventCreate。
 *
 * create 在 MonthGrid 层（即 Provider 提供方）绑定，无法消费自身提供的
 * context，因此交互原语以参数注入，而非 useMonthInteraction。
 */
export function useMonthCreate({
  gridPositionFinder,
  setDragPreview,
  commitCreate,
}: UseMonthCreateParams) {
  const startFlatRef = useRef<number | null>(null);
  /** 标记本次交互是否经历了真正的拖拽（越过 MINIMUM_DRAG_MOUSE_DISTANCE） */
  const hasDraggedRef = useRef(false);

  const previewOf = (startFlat: number, endFlat: number, e: MouseEvent): MonthDragPreview => ({
    kind: 'create',
    startFlat: Math.min(startFlat, endFlat),
    endFlat: Math.max(startFlat, endFlat),
    cursorX: e.clientX,
    cursorY: e.clientY,
  });

  return useDrag(DRAGGING_TYPE_CREATE.gridSelection('timeGrid'), {
    onInit: (e) => {
      hasDraggedRef.current = false;
      const pos = gridPositionFinder(e.clientX, e.clientY);
      startFlatRef.current = pos ? pos.flatOffset : null;
    },
    onDragStart: () => {
      hasDraggedRef.current = true;
    },
    onDrag: (e) => {
      const pos = gridPositionFinder(e.clientX, e.clientY);
      if (!pos || startFlatRef.current === null) {
        return;
      }
      setDragPreview(previewOf(startFlatRef.current, pos.flatOffset, e));
    },
    onMouseUp: (e) => {
      const pos = gridPositionFinder(e.clientX, e.clientY);
      setDragPreview(null);
      const startFlat = startFlatRef.current;
      const didDrag = hasDraggedRef.current;
      startFlatRef.current = null;
      hasDraggedRef.current = false;
      if (!pos || startFlat === null || !didDrag) {
        return;
      }
      commitCreate(Math.min(startFlat, pos.flatOffset), Math.max(startFlat, pos.flatOffset));
    },
  });
}
