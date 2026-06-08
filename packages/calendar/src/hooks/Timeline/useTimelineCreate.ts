import { useRef } from 'react';

import { useTimelineInteraction } from '@/components/timeline/TimelineInteractionContext';
import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';
import { useDrag } from '@/hooks/common/useDrag';

interface UseTimelineCreateParams {
  resourceIndex: number;
}

/**
 * Timeline 资源行空白处横拖创建：选中 [startDay, endDay] → 跨天全天事件。
 * 拖拽过程中显示创建预览，mouseup 经校验后提交 onEventCreate。
 */
export function useTimelineCreate({ resourceIndex }: UseTimelineCreateParams) {
  const { gridPositionFinder, setDragPreview, commitCreate } = useTimelineInteraction();
  const startDayRef = useRef<number | null>(null);

  const onCreateStart = useDrag(DRAGGING_TYPE_CREATE.gridSelection('timeGrid'), {
    onInit: (e) => {
      const pos = gridPositionFinder(e.clientX, e.clientY);
      startDayRef.current = pos ? pos.dayIndex : null;
    },
    onDrag: (e) => {
      const pos = gridPositionFinder(e.clientX, e.clientY);
      if (!pos || startDayRef.current === null) {
        return;
      }
      const startDayIndex = Math.min(startDayRef.current, pos.dayIndex);
      const endDayIndex = Math.max(startDayRef.current, pos.dayIndex);
      setDragPreview({
        kind: 'create',
        resourceIndex,
        startDayIndex,
        endDayIndex,
        cursorX: e.clientX,
        cursorY: e.clientY,
      });
    },
    onMouseUp: (e) => {
      const pos = gridPositionFinder(e.clientX, e.clientY);
      setDragPreview(null);
      if (!pos || startDayRef.current === null) {
        startDayRef.current = null;
        return;
      }
      const startDayIndex = Math.min(startDayRef.current, pos.dayIndex);
      const endDayIndex = Math.max(startDayRef.current, pos.dayIndex);
      startDayRef.current = null;
      commitCreate(resourceIndex, startDayIndex, endDayIndex);
    },
    onPressESCKey: () => {
      setDragPreview(null);
      startDayRef.current = null;
    },
  });

  return onCreateStart;
}
