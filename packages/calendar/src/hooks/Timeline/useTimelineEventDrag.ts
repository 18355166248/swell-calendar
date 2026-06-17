import { MouseEvent } from 'react';

import {
  TimelineDragPreview,
  useTimelineInteraction,
} from '@/components/timeline/TimelineInteractionContext';
import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';
import { useDrag } from '@/hooks/common/useDrag';
import { EventUIModel } from '@/model/eventUIModel';
import { DndState } from '@/types/dnd.type';

interface UseTimelineEventDragParams {
  uiModel: EventUIModel;
  resourceIndex: number;
  startDayIndex: number;
  endDayIndex: number;
}

function clampIndex(index: number, dayCount: number) {
  return Math.min(Math.max(index, 0), Math.max(dayCount - 1, 0));
}

/**
 * Timeline 事件横条的移动 / resize 交互。
 *
 * - move：整条横拖改天（按像素 / cellWidth 取整），纵向跨资源行改资源
 * - resize：左 / 右边各一个手柄，拖动改起 / 止天
 *
 * 拖拽过程中更新预览（幽灵横条 + tooltip），mouseup 经校验后提交 onEventUpdate。
 */
export function useTimelineEventDrag({
  uiModel,
  resourceIndex,
  startDayIndex,
  endDayIndex,
}: UseTimelineEventDragParams) {
  const { cellWidth, dayCount, gridPositionFinder, setDragPreview, commitMove, commitResize } =
    useTimelineInteraction();

  const dayDeltaOf = (e: MouseEvent, dnd: DndState) => {
    const initX = dnd.initX ?? e.clientX;
    return Math.round((e.clientX - initX) / cellWidth);
  };

  const moveType = DRAGGING_TYPE_CREATE.moveEvent('timeGrid', `${uiModel.cid()}`);
  const resizeStartType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', `${uiModel.cid()}`, 'start');
  const resizeEndType = DRAGGING_TYPE_CREATE.resizeEvent('timeGrid', `${uiModel.cid()}`, 'end');

  const previewBase = (kind: TimelineDragPreview['kind'], e: MouseEvent) => ({
    kind,
    cursorX: e.clientX,
    cursorY: e.clientY,
  });

  const onMoveStart = useDrag(moveType, {
    onDrag: (e, dnd) => {
      const dayDelta = dayDeltaOf(e, dnd);
      const pos = gridPositionFinder(e.clientX, e.clientY);
      const targetResourceIndex = pos ? pos.resourceIndex : resourceIndex;
      setDragPreview({
        ...previewBase('move', e),
        resourceIndex: targetResourceIndex,
        startDayIndex: clampIndex(startDayIndex + dayDelta, dayCount),
        endDayIndex: clampIndex(endDayIndex + dayDelta, dayCount),
      });
    },
    onMouseUp: (e, dnd) => {
      const dayDelta = dayDeltaOf(e, dnd);
      const pos = gridPositionFinder(e.clientX, e.clientY);
      const targetResourceIndex = pos ? pos.resourceIndex : resourceIndex;
      setDragPreview(null);
      if (dayDelta !== 0 || targetResourceIndex !== resourceIndex) {
        commitMove(uiModel, dayDelta, targetResourceIndex);
      }
    },
  });

  const makeResizeHandlers = (edge: 'start' | 'end') => ({
    onDrag: (e: MouseEvent, dnd: DndState) => {
      const dayDelta = dayDeltaOf(e, dnd);
      const nextStart =
        edge === 'start' ? clampIndex(startDayIndex + dayDelta, dayCount) : startDayIndex;
      const nextEnd = edge === 'end' ? clampIndex(endDayIndex + dayDelta, dayCount) : endDayIndex;
      setDragPreview({
        ...previewBase('resize', e),
        resourceIndex,
        startDayIndex: Math.min(nextStart, nextEnd),
        endDayIndex: Math.max(nextStart, nextEnd),
      });
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
