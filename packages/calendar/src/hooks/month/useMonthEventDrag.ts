import { MouseEvent } from 'react';

import { MonthDragPreview, useMonthInteraction } from '@/components/month/MonthInteractionContext';
import { computeMovePreviewRange, computeResizePreviewRange } from '@/controller/month-interaction';
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

type ResizeEdge = 'start' | 'end';

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
  const { weekCount, colCount, gridPositionFinder, setDragPreview, commitMove, commitResize } =
    useMonthInteraction();

  const dayDeltaOf = (e: MouseEvent, dnd: DndState): number => {
    const initPos = gridPositionFinder(dnd.initX ?? e.clientX, dnd.initY ?? e.clientY);
    const curPos = gridPositionFinder(e.clientX, e.clientY);
    if (!initPos || !curPos) {
      return 0;
    }
    return curPos.flatOffset - initPos.flatOffset;
  };

  const previewOf = (dayDelta: number, e: MouseEvent): MonthDragPreview => ({
    kind: 'move',
    ...computeMovePreviewRange({ weekIndex, startCol, colspan, dayDelta, weekCount, colCount }),
    cursorX: e.clientX,
    cursorY: e.clientY,
  });

  const resizePreviewOf = (
    edge: ResizeEdge,
    dayDelta: number,
    e: MouseEvent
  ): MonthDragPreview => ({
    kind: 'resize',
    ...computeResizePreviewRange({
      weekIndex,
      startCol,
      colspan,
      edge,
      dayDelta,
      weekCount,
      colCount,
    }),
    cursorX: e.clientX,
    cursorY: e.clientY,
  });

  const moveType = DRAGGING_TYPE_CREATE.moveEvent('timeGrid', `${uiModel.cid()}`);
  const resizeStartType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', `${uiModel.cid()}`, 'start');
  const resizeEndType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', `${uiModel.cid()}`, 'end');

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
  });

  const makeResizeHandlers = (edge: ResizeEdge) => ({
    onDrag: (e: MouseEvent, dnd: DndState) => {
      setDragPreview(resizePreviewOf(edge, dayDeltaOf(e, dnd), e));
    },
    onMouseUp: (e: MouseEvent, dnd: DndState) => {
      const dayDelta = dayDeltaOf(e, dnd);
      setDragPreview(null);
      if (dayDelta !== 0) {
        commitResize(uiModel, edge, dayDelta);
      }
    },
  });

  const onResizeStartStart = useDrag(resizeStartType, makeResizeHandlers('start'));
  const onResizeEndStart = useDrag(resizeEndType, makeResizeHandlers('end'));

  return { onMoveStart, onResizeStartStart, onResizeEndStart };
}
