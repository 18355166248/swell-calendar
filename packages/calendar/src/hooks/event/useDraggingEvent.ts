import { isNil } from 'lodash-es';
import { useRef, useState } from 'react';

import { EventUIModel } from '@/model/eventUIModel';
import { DraggingState } from '@/types/dnd.type';
import { EventDraggingArea, EventDraggingBehavior, EventResizeDirection } from '@/types/drag.type';

import { useTransientUpdatesCalendar } from '../common/useTransientUpdatesCalendar';

/**
 * 解析拖拽 item type，匹配则返回事件 id 与 resize 方向
 * - move：`event/${area}/move/${id}`
 * - resize：`event/${area}/resize/${id}`（无方向，默认 'end'）
 *   或 `event/${area}/resize/${direction}/${id}`（'start' 顶边 / 'end' 底边）
 */
export const matchEventDraggingType = (
  itemType: string | null,
  area: EventDraggingArea,
  behavior: EventDraggingBehavior
): { id: string; direction: EventResizeDirection } | null => {
  if (isNil(itemType)) {
    return null;
  }

  const pattern =
    behavior === 'resize'
      ? new RegExp(`^event/${area}/resize/(?:(start|end)/)?\\d+$`)
      : new RegExp(`^event/${area}/${behavior}/\\d+$`);

  if (!pattern.test(itemType)) {
    return null;
  }

  const segments = itemType.split('/');
  const id = segments[segments.length - 1];
  const directionSegment = segments[3];
  const direction: EventResizeDirection =
    behavior === 'resize' && (directionSegment === 'start' || directionSegment === 'end')
      ? directionSegment
      : 'end';

  return { id, direction };
};

export function useDraggingEvent(area: EventDraggingArea, behavior: EventDraggingBehavior) {
  // 拖拽结束
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  // 拖拽取消
  const [isDraggingCanceled, setIsDraggingCanceled] = useState(false);
  // 拖拽中事件
  const [draggingEvent, setDraggingEvent] = useState<EventUIModel | null>(null);
  // resize 方向（仅 behavior === 'resize' 有意义，默认 'end' 底边）
  const [resizeDirection, setResizeDirection] = useState<EventResizeDirection>('end');

  // "本 hook 已开始一次拖拽" 的同步标记。
  // 不能在 transient 回调里直接读 `draggingEvent`（state）判断是否结束：state 更新到下次 render 才生效，
  // 而 mousedown→setDragging→reset 可能在同一批次内连续触发 store 变更，回调读到的是过期闭包值，
  // 导致 IDLE/CANCELED 的"结束"分支漏判 → `draggingEvent` 永远停在上一次拖拽的事件上，
  // 表现为"其它卡片再也无法 resize/拖拽"。用回调内同步置位的 ref，彻底消除该竞态。
  const startedRef = useRef(false);

  useTransientUpdatesCalendar(
    (state) => state.dnd,
    ({ draggingItemType, draggingEventUIModel, draggingState }) => {
      const matched = matchEventDraggingType(draggingItemType, area, behavior);
      const hasMatchingTargetEvent = Number(matched?.id) === draggingEventUIModel?.cid();
      const isIdle = draggingState === DraggingState.IDLE;
      const isCanceled = draggingState === DraggingState.CANCELED;
      if (!startedRef.current && hasMatchingTargetEvent) {
        startedRef.current = true;
        setDraggingEvent(draggingEventUIModel);
        if (matched) {
          setResizeDirection(matched.direction);
        }
      }

      if (startedRef.current && (isIdle || isCanceled)) {
        setIsDraggingEnd(true);
        setIsDraggingCanceled(isCanceled);
      }
    }
  );

  const clearDraggingEvent = () => {
    startedRef.current = false;
    setDraggingEvent(null);
    setIsDraggingEnd(false);
    setIsDraggingCanceled(false);
    setResizeDirection('end');
  };

  return {
    isDraggingEnd,
    isDraggingCanceled,
    draggingEvent,
    resizeDirection,
    clearDraggingEvent,
  };
}
