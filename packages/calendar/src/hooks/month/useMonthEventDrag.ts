import { MouseEvent } from 'react';

import { MonthDragPreview, useMonthInteraction } from '@/components/month/MonthInteractionContext';
import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';
import { useDrag } from '@/hooks/common/useDrag';
import { EventUIModel } from '@/model/eventUIModel';
import { DndState } from '@/types/dnd.type';

interface UseMonthEventDragParams {
  uiModel: EventUIModel;
  /** 事件当前所在周行 */
  weekIndex: number;
  /** 事件当前段在周内的起始列 */
  startCol: number;
  /** 事件当前段跨列数 */
  colspan: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 月视图事件条的移动交互（按天换格）。
 *
 * dayDelta = 当前光标落点 flatOffset − 按下时落点 flatOffset（2D 压平）。
 * 拖拽过程中把当前段按 dayDelta 平移后渲染幽灵条；mouseup 经校验提交 onEventUpdate。
 */
export function useMonthEventDrag({
  uiModel,
  weekIndex,
  startCol,
  colspan,
}: UseMonthEventDragParams) {
  const { weekCount, colCount, gridPositionFinder, setDragPreview, commitMove } =
    useMonthInteraction();

  const dayDeltaOf = (e: MouseEvent, dnd: DndState): number => {
    const initPos = gridPositionFinder(dnd.initX ?? e.clientX, dnd.initY ?? e.clientY);
    const curPos = gridPositionFinder(e.clientX, e.clientY);
    if (!initPos || !curPos) {
      return 0;
    }
    return curPos.flatOffset - initPos.flatOffset;
  };

  const previewOf = (dayDelta: number, e: MouseEvent): MonthDragPreview => {
    const srcFlat = weekIndex * colCount + startCol;
    const nextFlat = clamp(srcFlat + dayDelta, 0, weekCount * colCount - 1);
    const nextWeekIndex = Math.floor(nextFlat / colCount);
    const nextStartCol = nextFlat % colCount;
    const nextColspan = clamp(colspan, 1, colCount - nextStartCol);
    return {
      kind: 'move',
      weekIndex: nextWeekIndex,
      startCol: nextStartCol,
      colspan: nextColspan,
      cursorX: e.clientX,
      cursorY: e.clientY,
    };
  };

  const moveType = DRAGGING_TYPE_CREATE.moveEvent('timeGrid', `${uiModel.cid()}`);

  const onMoveStart = useDrag(moveType, {
    onDrag: (e, dnd) => {
      setDragPreview(previewOf(dayDeltaOf(e, dnd), e));
    },
    onMouseUp: (e, dnd) => {
      const dayDelta = dayDeltaOf(e, dnd);
      setDragPreview(null);
      if (dayDelta !== 0) {
        commitMove(uiModel, dayDelta);
      }
    },
    onPressESCKey: () => setDragPreview(null),
  });

  return { onMoveStart };
}
