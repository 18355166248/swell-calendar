import { EventUIModel } from '@/model/eventUIModel';
import { useState } from 'react';
import { useTransientUpdatesCalendar } from '../common/useTransientUpdatesCalendar';
import { EventDragging, EventDraggingArea, EventDraggingBehavior } from '@/types/drag.type';
import { isNil, last } from 'lodash-es';
import { DraggingState } from '@/types/dnd.type';

const getTargetEventId = (
  itemType: string | null,
  area: EventDraggingArea,
  behavior: EventDraggingBehavior
) => {
  function isEventDraggingType(_itemType: string): _itemType is EventDragging {
    return new RegExp(`^event/${area}/${behavior}/\\d+$`).test(_itemType);
  }

  if (isNil(itemType)) {
    return null;
  }

  return isEventDraggingType(itemType) ? last(itemType.split('/')) : null;
};

export function useDraggingEvent(area: EventDraggingArea, behavior: EventDraggingBehavior) {
  // 拖拽结束
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  // 拖拽取消
  const [isDraggingCanceled, setIsDraggingCanceled] = useState(false);
  // 拖拽中事件
  const [draggingEvent, setDraggingEvent] = useState<EventUIModel | null>(null);

  useTransientUpdatesCalendar(
    (state) => state.dnd,
    ({ draggingItemType, draggingEventUIModel, draggingState }) => {
      const targetEventId = getTargetEventId(draggingItemType, area, behavior);
      const hasMatchingTargetEvent = Number(targetEventId) === draggingEventUIModel?.cid();
      const isIdle = draggingState === DraggingState.IDLE;
      const isCanceled = draggingState === DraggingState.CANCELED;
      if (isNil(draggingEvent) && hasMatchingTargetEvent) {
        setDraggingEvent(draggingEventUIModel);
      }

      if (!isNil(draggingEvent) && (isIdle || isCanceled)) {
        setIsDraggingEnd(true);
        setIsDraggingCanceled(isCanceled);
      }
    }
  );

  const clearDraggingEvent = () => {
    setDraggingEvent(null);
    setIsDraggingEnd(false);
    setIsDraggingCanceled(false);
  };

  return {
    isDraggingEnd,
    isDraggingCanceled,
    draggingEvent,
    clearDraggingEvent,
  };
}
