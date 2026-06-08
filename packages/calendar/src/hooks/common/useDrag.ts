import { isNil } from 'lodash-es';
import { KeyboardEvent, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';

import { KEY } from '@/constants/keyboard';
import { MINIMUM_DRAG_MOUSE_DISTANCE } from '@/constants/mouse.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { DndState, DraggingState } from '@/types/dnd.type';
import { DraggingTypes } from '@/types/drag.type';
import { MouseEventListener } from '@/types/events.type';
import { isLeftMouseButton } from '@/utils/mouse';

import useLatest from './useLatest';

type MouseListener = (e: MouseEvent, dnd: DndState) => void;
type KeyboardListener = (e: KeyboardEvent, dnd: DndState) => void;
type KeyboardEventListener = (e: globalThis.KeyboardEvent) => void;

// 空函数，用于默认返回值
const noop = () => {};

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
  /** 按下 ESC 键时触发，用于取消拖拽操作 */
  onPressESCKey?: KeyboardListener;
}

export function useDrag(
  draggingType: DraggingTypes,
  { onInit, onDragStart, onDrag, onMouseUp, onPressESCKey }: DragListeners
) {
  const { dnd } = useCalendarStore();
  const { initDrag, setDragging, cancelDrag, reset } = dnd;

  const dndSliceRef = useLatest(dnd);

  const [isStarted, setIsStarted] = useState(false);

  const handleMouseMoveRef = useRef<MouseEventListener | null>(null);
  const handleMouseUpRef = useRef<MouseEventListener | null>(null);
  const handleKeyDownRef = useRef<KeyboardEventListener | null>(null);

  // 鼠标按下
  const handleMouseDown = useCallback<MouseEventListener>(
    (e) => {
      // 只处理左键按下
      if (!isLeftMouseButton(e)) return;

      // 阻止默认行为
      e.preventDefault();

      setIsStarted(true);
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

      if (isStarted) {
        setIsStarted(false);
        onMouseUp?.(e, dndSliceRef.current);
        reset();
      }
    },
    [isStarted, onMouseUp, reset, dndSliceRef]
  );

  /**
   * 键盘事件处理函数
   * 拖拽进行中按 ESC 取消本次拖拽：先结束监听阻断后续 mouseup 提交，
   * 再让消费方清理自身预览/视觉，最后把状态置 CANCELED 使提交方跳过提交。
   *
   * 注意：这里只 cancelDrag()，不 reset()。`useDraggingEvent` 在 IDLE 分支会把
   * isDraggingCanceled 重写为 false，若同步 reset 会让 CANCELED 被覆盖、误判为正常结束。
   * CANCELED 作为终态，由下一次 initDrag 自然复位。
   */
  const handleKeyDown = useCallback<KeyboardEventListener>(
    (e) => {
      if (e.key !== KEY.ESCAPE) return;

      setIsStarted(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onPressESCKey?.(e as any, dndSliceRef.current);
      cancelDrag();
    },
    [onPressESCKey, cancelDrag, dndSliceRef]
  );

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
    handleKeyDownRef.current = handleKeyDown;
  }, [handleMouseMove, handleMouseUp, handleKeyDown]);

  // 根据拖拽状态添加/移除全局事件监听器
  useEffect(() => {
    const wrappedHandleMouseMove = (e: globalThis.MouseEvent) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleMouseMoveRef.current?.(e as any);
    const wrappedHandleMouseUp = (e: globalThis.MouseEvent) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleMouseUpRef.current?.(e as any);
    const wrappedHandleKeyDown = (e: globalThis.KeyboardEvent) => handleKeyDownRef.current?.(e);

    if (isStarted) {
      // 拖拽开始时添加全局事件监听器
      document.addEventListener('mousemove', wrappedHandleMouseMove);
      document.addEventListener('mouseup', wrappedHandleMouseUp);
      document.addEventListener('keydown', wrappedHandleKeyDown);

      return () => {
        // 清理事件监听器
        document.removeEventListener('mousemove', wrappedHandleMouseMove);
        document.removeEventListener('mouseup', wrappedHandleMouseUp);
        document.removeEventListener('keydown', wrappedHandleKeyDown);
      };
    }

    return noop;
  }, [isStarted]);

  return handleMouseDown;
}
