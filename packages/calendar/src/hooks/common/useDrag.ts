import { useCalendarStore } from '@/contexts/calendarStore';
import { KeyboardEventListener, MouseEventListener } from '@/types/events.type';
import { isLeftMouseButton } from '@/utils/mouse';
import { useCallback, useRef, useState, MouseEvent, KeyboardEvent } from 'react';

type MouseListener = (e: MouseEvent) => void;
type KeyboardListener = (e: KeyboardEvent) => void;

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

export function useDrag({ onInit, onDragStart, onDrag, onMouseUp, onPressESCKey }: DragListeners) {
  const { dnd } = useCalendarStore();
  const { initDrag, setDragging, cancelDrag, endDrag } = dnd;

  const dndSliceRef = useRef(dnd);

  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMoveRef = useRef<MouseEventListener | null>(null);
  const handleMouseUpRef = useRef<MouseEventListener | null>(null);
  const handleKeyDownRef = useRef<KeyboardEventListener | null>(null);

  // 鼠标按下
  const handleMouseDown = useCallback<MouseEventListener>(
    (e) => {
      // 只处理左键按下
      if (!isLeftMouseButton(e)) return;
      console.log('🚀 ~ useDrag ~ e:', e);

      // 阻止默认行为
      e.preventDefault();

      setIsDragging(true);
      initDrag({
        draggingItemType: null,
        initX: e.clientX,
        initY: e.clientY,
      });
      onInit?.(e);
    },
    [initDrag, onInit]
  );

  /**
   * 鼠标移动事件处理函数
   * 处理拖拽过程中的移动逻辑
   */
  const handleMouseMove = useCallback<MouseEventListener>((e) => {
    console.log('🚀 ~ useDrag ~ e:', e);
    const { initX, initY, draggingState } = dndSliceRef.current;
  }, []);

  return handleMouseDown;
}
