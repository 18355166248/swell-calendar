import { isNil } from 'lodash-es';
import { MouseEvent, useCallback, useEffect, useRef } from 'react';

import { MINIMUM_DRAG_MOUSE_DISTANCE } from '@/constants/mouse.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { DndState, DraggingState } from '@/types/dnd.type';
import { DraggingTypes } from '@/types/drag.type';
import { MouseEventListener } from '@/types/events.type';
import { isLeftMouseButton } from '@/utils/mouse';

import useLatest from './useLatest';

type MouseListener = (e: MouseEvent, dnd: DndState) => void;

/**
 * 判断鼠标是否移动了足够距离
 * 用于区分点击和拖拽操作
 * @param initX - 初始 X 坐标
 * @param initY - 初始 Y 坐标
 * @param x - 当前 X 坐标
 * @param y - 当前 Y 坐标
 * @returns 如果移动距离超过阈值返回 true，否则返回 false
 */
function isMouseMoved(initX: number, initY: number, x: number, y: number) {
  return (
    Math.abs(initX - x) >= MINIMUM_DRAG_MOUSE_DISTANCE ||
    Math.abs(initY - y) >= MINIMUM_DRAG_MOUSE_DISTANCE
  );
}

/**
 * 拖拽事件监听器接口
 * 定义了拖拽过程中各个阶段可以触发的回调函数
 */
export interface DragListeners {
  /** 鼠标按下时触发，用于初始化拖拽状态 */
  onInit?: MouseListener;
  /** 拖拽开始时触发，当鼠标移动距离超过阈值时调用 */
  onDragStart?: MouseListener;
  /** 拖拽过程中触发，鼠标移动时持续调用 */
  onDrag?: MouseListener;
  /** 鼠标释放时触发，结束拖拽操作 */
  onMouseUp?: MouseListener;
}

export function useDrag(
  draggingType: DraggingTypes,
  { onInit, onDragStart, onDrag, onMouseUp }: DragListeners
) {
  const { dnd } = useCalendarStore();
  const { initDrag, setDragging, reset } = dnd;

  const dndSliceRef = useLatest(dnd);

  // 「拖拽进行中」用 ref 而非 state 跟踪：handleMouseUp 的守卫需要同步读到最新值，
  // 用 state 会读到旧闭包值，导致快速点击时 mouseup 被守卫挡掉。
  const isStartedRef = useRef(false);

  const handleMouseMoveRef = useRef<MouseEventListener | null>(null);
  const handleMouseUpRef = useRef<MouseEventListener | null>(null);

  // 全局监听器用稳定的包装函数注册，包装函数转发到最新的 ref 处理器，
  // 这样 add/removeEventListener 引用一致，且始终调用到最新逻辑。
  const wrappedMoveRef = useRef((e: globalThis.MouseEvent) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleMouseMoveRef.current?.(e as any)
  );
  const wrappedUpRef = useRef((e: globalThis.MouseEvent) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleMouseUpRef.current?.(e as any)
  );

  const detachListeners = useCallback(() => {
    document.removeEventListener('mousemove', wrappedMoveRef.current);
    document.removeEventListener('mouseup', wrappedUpRef.current);
  }, []);

  // 鼠标按下
  const handleMouseDown = useCallback<MouseEventListener>(
    (e) => {
      // 只处理左键按下
      if (!isLeftMouseButton(e)) return;

      // 阻止默认行为
      e.preventDefault();

      // 同步挂载全局监听器，而不是等 useEffect（passive，paint 后才执行）。
      // 否则极快的点击/拖拽其 mouseup 会先于监听器注册而丢失，表现为「完全没反应」。
      isStartedRef.current = true;
      document.addEventListener('mousemove', wrappedMoveRef.current);
      document.addEventListener('mouseup', wrappedUpRef.current);

      initDrag({
        draggingItemType: draggingType,
        initX: e.clientX,
        initY: e.clientY,
      });
      onInit?.(e, dndSliceRef.current);
    },
    [initDrag, draggingType, onInit, dndSliceRef]
  );

  /**
   * 鼠标移动事件处理函数
   * 处理拖拽过程中的移动逻辑
   */
  const handleMouseMove = useCallback<MouseEventListener>(
    (e) => {
      // 兜底自恢复：拖拽进行中若主键（左键）已不再按下，说明 mouseup 丢失
      // （窗口外释放 / 失焦 / 被导航打断等）。此时立即按"结束拖拽"清理，
      // 否则 dnd 会卡在 DRAGGING：卡片半透明、且后续无法再拖拽/resize，只能刷新。
      if ((e.buttons & 1) === 0) {
        handleMouseUpRef.current?.(e);
        return;
      }

      const { initX, initY, draggingState } = dndSliceRef.current;

      // 检查鼠标是否移动了足够距离
      if (!isNil(initX) && !isNil(initY) && !isMouseMoved(initX, initY, e.clientX, e.clientY)) {
        return;
      }

      if (draggingState <= DraggingState.INIT) {
        setDragging({
          x: e.clientX,
          y: e.clientY,
        });
        onDragStart?.(e, dndSliceRef.current);
        return;
      }

      setDragging({
        x: e.clientX,
        y: e.clientY,
      });
      onDrag?.(e, dndSliceRef.current);
    },
    [onDragStart, onDrag, setDragging, dndSliceRef]
  );

  /**
   * 鼠标释放事件处理函数
   * 处理拖拽结束后的逻辑
   */
  const handleMouseUp = useCallback<MouseEventListener>(
    (e) => {
      e.stopPropagation();

      if (isStartedRef.current) {
        isStartedRef.current = false;
        detachListeners();
        onMouseUp?.(e, dndSliceRef.current);
        reset();
      }
    },
    [detachListeners, onMouseUp, reset, dndSliceRef]
  );

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
  }, [handleMouseMove, handleMouseUp]);

  // 卸载时兜底清理：避免拖拽进行中组件被卸载导致监听器泄漏
  useEffect(() => detachListeners, [detachListeners]);

  return handleMouseDown;
}
