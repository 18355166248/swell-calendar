import { useCallback, useEffect, useRef } from 'react';

import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStoreInternal } from '@/contexts/calendarStore';
import {
  crossInstanceBridge,
  CrossInstanceBridgeMessage,
} from '@/controller/cross-instance-bridge';
import {
  createCrossInstanceDropInfo,
  createTimeGridDropPreview,
} from '@/controller/scheduler.controller';
import { isMoveDraggingType } from '@/helpers/drag';
import { EventUIModel } from '@/model/eventUIModel';
import { DraggingState } from '@/types/dnd.type';
import { TimeGridDropPreview } from '@/types/dnd-preview.type';
import { EventObject } from '@/types/events.type';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { CalendarState } from '@/types/store.type';

interface UseCrossInstanceDnDParams {
  enabled: boolean;
  containerEl: HTMLElement | null;
  gridPositionFinder: GridPositionFinder;
  timeGridData: TimeGridData;
  onPreviewChange?: (preview: TimeGridDropPreview | null) => void;
}

/**
 * 跨实例拖拽 hook
 *
 * 源侧（publish）：当本实例的内部拖拽在日历容器外部结束时，
 * 通过 bridge 发布事件数据，并触发 onCrossInstanceDragEnd 回调。
 *
 * 目标侧（subscribe）：订阅 bridge，当其他实例发布拖拽数据时，
 * 检查 cursor 是否在本容器内，如果是则计算 drop 位置并触发 onCrossInstanceDrop。
 *
 * 限制：同一页面的多个 Calendar 实例不应有视觉重叠。
 * 若两个实例的容器在 DOM 中重叠（z-index 叠加或布局嵌套），
 * `elementsFromPoint` 可能同时命中两个容器，导致多个实例都触发 onCrossInstanceDrop。
 */
export function useCrossInstanceDnD({
  enabled,
  containerEl,
  gridPositionFinder,
  timeGridData,
  onPreviewChange,
}: UseCrossInstanceDnDParams) {
  const store = useCalendarStoreInternal();
  const callbacks = useCalendarCallbacks();

  // 用 ref 保存拖拽中的事件模型和最后已知 cursor 位置
  const draggingModelRef = useRef<EventUIModel | null>(null);
  const lastCursorRef = useRef<{ x: number; y: number } | null>(null);
  const wasDraggingRef = useRef(false);

  // 保持 containerEl 的最新值（避免 subscribe 闭包捕获旧值）
  const containerElRef = useRef(containerEl);
  containerElRef.current = containerEl;

  const publishClear = useCallback((event?: EventObject) => {
    crossInstanceBridge.publish({
      type: 'clear',
      event:
        event ??
        ({
          title: '',
          category: 'time',
          start: new Date(0),
          end: new Date(0),
        } as EventObject),
      cursorX: 0,
      cursorY: 0,
      sourceContainer: containerElRef.current,
    });
  }, []);

  // 源侧：监听 DnD 状态变化，捕获拖拽数据和 cursor
  useEffect(() => {
    if (!enabled) return;

    return store.subscribe((state: CalendarState) => {
      const { draggingState, draggingEventUIModel, draggingItemType, x, y } = state.dnd;

      // 捕获拖拽中的事件模型。
      // 跨实例只接管「移动」：resize / create 是实例内行为，不捕获，从而后续
      // preview 与 IDLE 落点逻辑对它们自然 no-op，避免 resize 拖到容器外被误判为跨实例拖出。
      // 注意：reset() 会把 draggingItemType 与 draggingState 一并清空，所以类型判定只放在
      // 捕获阶段，cleanup（IDLE / CANCELED）仍依赖 wasDraggingRef，不能用提前 return 跳过。
      if (
        draggingState === DraggingState.DRAGGING &&
        draggingEventUIModel &&
        isMoveDraggingType(draggingItemType)
      ) {
        draggingModelRef.current = draggingEventUIModel;
        wasDraggingRef.current = true;
      }

      // 持续更新 cursor 位置
      if (x != null && y != null) {
        lastCursorRef.current = { x, y };
      }

      if (
        draggingState === DraggingState.DRAGGING &&
        draggingModelRef.current &&
        lastCursorRef.current
      ) {
        crossInstanceBridge.publish({
          type: 'preview',
          event: draggingModelRef.current.model.toEventObject(),
          cursorX: lastCursorRef.current.x,
          cursorY: lastCursorRef.current.y,
          sourceContainer: containerElRef.current,
        });
      }

      if (wasDraggingRef.current && draggingState === DraggingState.CANCELED) {
        wasDraggingRef.current = false;
        draggingModelRef.current = null;
        lastCursorRef.current = null;
        publishClear();
        return;
      }

      // 检测 DRAGGING → IDLE 转变
      if (wasDraggingRef.current && draggingState === DraggingState.IDLE) {
        const model = draggingModelRef.current;
        const cursor = lastCursorRef.current;

        // 重置标记
        wasDraggingRef.current = false;
        draggingModelRef.current = null;
        lastCursorRef.current = null;

        if (!model || !cursor) return;

        // 检查 cursor 是否在容器外部
        const container = containerElRef.current;
        if (!container) return;

        const elements = document.elementsFromPoint(cursor.x, cursor.y);
        const eventObject = model.model.toEventObject();

        if (elements.includes(container)) {
          publishClear(eventObject);
          return;
        }

        // cursor 在容器外部 → 跨实例拖出
        // 触发源侧回调
        callbacks?.onCrossInstanceDragEnd?.({
          event: eventObject,
        });

        // 发布到 bridge
        crossInstanceBridge.publish({
          type: 'drop',
          event: eventObject,
          cursorX: cursor.x,
          cursorY: cursor.y,
          sourceContainer: container,
        });
        publishClear(eventObject);
      }
    });
  }, [enabled, store, callbacks, publishClear]);

  // 目标侧：订阅 bridge
  const handleCrossInstanceReceive = useCallback(
    (data: CrossInstanceBridgeMessage) => {
      const container = containerElRef.current;
      if (!container) return;
      if (data.sourceContainer === container) return;

      if (data.type === 'clear') {
        onPreviewChange?.(null);
        return;
      }

      // 检查 cursor 是否在本容器内
      const elements = document.elementsFromPoint(data.cursorX, data.cursorY);
      if (!elements.includes(container)) {
        onPreviewChange?.(null);
        return;
      }

      // 计算 grid 位置
      const position = gridPositionFinder({ clientX: data.cursorX, clientY: data.cursorY });
      if (!position) {
        onPreviewChange?.(null);
        return;
      }

      if (data.type === 'preview') {
        onPreviewChange?.(
          createTimeGridDropPreview('cross-instance', 'allowed', timeGridData, position, data.event)
        );
        return;
      }

      // 构造 drop info
      const dropInfo = createCrossInstanceDropInfo(timeGridData, position);
      onPreviewChange?.(null);

      callbacks?.onCrossInstanceDrop?.({
        event: data.event,
        date: dropInfo.date,
        start: dropInfo.start,
        end: dropInfo.end,
        resourceId: dropInfo.resourceId,
        resourceName: dropInfo.resourceName,
      });
    },
    [gridPositionFinder, timeGridData, callbacks, onPreviewChange]
  );

  useEffect(() => {
    if (!enabled) return;
    return crossInstanceBridge.subscribe(handleCrossInstanceReceive);
  }, [enabled, handleCrossInstanceReceive]);
}
