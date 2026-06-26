import { isNil } from 'lodash-es';
import { MouseEvent, useEffect, useRef, useState } from 'react';

import { LONG_PRESS_CREATE_OPEN_DELAY, LONG_PRESS_DELAY } from '@/constants/mouse.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { DRAGGING_TYPE_CREATE } from '@/helpers/drag';
import { DraggingState } from '@/types/dnd.type';
import { GridPosition, GridPositionFinder } from '@/types/grid.type';
import { GridSelectionData, GridSelectionType } from '@/types/gridSelection.type';

import { useDrag } from '../common/useDrag';
import { useTransientUpdatesCalendar } from '../common/useTransientUpdatesCalendar';

export function useGridSelection({
  type,
  gridPositionFinder,
  selectionSorter,
  constrainPosition,
  onClickSelection,
  onSelectionEnd,
}: {
  type: GridSelectionType;
  gridPositionFinder: GridPositionFinder;
  selectionSorter: (initPos: GridPosition, currentPos: GridPosition) => GridSelectionData;
  /**
   * 可选的位置约束函数
   * 在计算选区之前对当前位置进行约束，用于限制拖拽范围
   * 例如：scheduler 视图中同一天不同资源的列之间不允许跨列选区
   */
  constrainPosition?: (initPos: GridPosition, currentPos: GridPosition) => GridPosition;
  onClickSelection?: (selection: GridSelectionData) => void;
  onSelectionEnd?: (selection: GridSelectionData) => void;
}) {
  const [initGridPosition, setInitGridPosition] = useState<GridPosition | null>(null);
  const { setGridSelection, clearAll } = useCalendarStore((state) => state.gridSelection);
  const gridSelectionRef = useRef<GridSelectionData | null>(null); // 当前网格选择数据

  // 触控长按松手后延迟打开弹窗的计时器
  const delayedCreateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 记录长按激活时计算好的初始选区（供松手后 200ms timer 使用）
  const pendingTouchSelectionRef = useRef<GridSelectionData | null>(null);

  const currentGridSelectionType = DRAGGING_TYPE_CREATE.gridSelection(type);

  useTransientUpdatesCalendar<GridSelectionData | null>(
    (state) => state.gridSelection.timeGrid,
    (gridSelection) => {
      gridSelectionRef.current = gridSelection;
    }
  );

  // 组件卸载时清理延迟计时器
  useEffect(
    () => () => {
      if (!isNil(delayedCreateTimerRef.current)) {
        clearTimeout(delayedCreateTimerRef.current);
        delayedCreateTimerRef.current = null;
      }
    },
    []
  );

  /**
   * 根据鼠标位置设置网格选择
   * @param e 鼠标事件
   */
  const setGridSelectionByPosition = (e: MouseEvent) => {
    const gridPosition = gridPositionFinder(e);
    if (!isNil(initGridPosition) && !isNil(gridPosition)) {
      // 如果提供了位置约束函数，先对当前位置进行约束
      const constrainedPosition = constrainPosition
        ? constrainPosition(initGridPosition, gridPosition)
        : gridPosition;
      setGridSelection(type, selectionSorter(initGridPosition, constrainedPosition));
    }
  };

  const onMouseup = (e: MouseEvent, isClick: boolean) => {
    let selection: GridSelectionData | null = null;

    if (isClick) {
      setGridSelectionByPosition(e);
      selection = gridSelectionRef.current;
    } else {
      selection = gridSelectionRef.current;
    }

    if (!isNil(selection)) {
      if (isClick) {
        onClickSelection?.(selection);
      } else {
        onSelectionEnd?.(selection);
      }
    }

    clearAll();
    setInitGridPosition(null);
  };

  // 鼠标抬起事件处理函数 点击事件
  const onMouseUpWithClick = (e: MouseEvent) => {
    onMouseup(e, true);
  };

  const onMouseDown = useDrag(
    currentGridSelectionType,
    {
      onInit: (e) => {
        // 获取并记录初始网格位置
        const gridPosition = gridPositionFinder(e);
        if (isNil(gridPosition)) return;

        setInitGridPosition(gridPosition);

        // 触控长按激活：立即渲染单格临时卡片（与拖拽创建选区外观一致）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((e as any).pointerType === 'touch') {
          const selection = selectionSorter(gridPosition, gridPosition);
          pendingTouchSelectionRef.current = selection;
          setGridSelection(type, selection);
        }
      },
      onDragStart: (e) => {
        // 拖拽开始，取消可能存在的延迟计时器（不应发生，但作保险）
        if (!isNil(delayedCreateTimerRef.current)) {
          clearTimeout(delayedCreateTimerRef.current);
          delayedCreateTimerRef.current = null;
        }
        pendingTouchSelectionRef.current = null;
        setGridSelectionByPosition(e);
      },
      onDrag: (e) => {
        if (gridSelectionRef.current) {
          setGridSelectionByPosition(e);
        }
      },
      onMouseUp: (e, { draggingState }) => {
        e.stopPropagation();

        // 判断是否为点击事件（拖拽状态小于等于初始状态表示没有发生拖拽）
        const isClickEvent = draggingState <= DraggingState.INIT;

        if (isClickEvent) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isTouchClick = (e as any).pointerType === 'touch';

          if (isTouchClick) {
            // 触控长按松手：临时卡片保持可见，200ms 后打开创建弹窗
            const captured = pendingTouchSelectionRef.current;
            pendingTouchSelectionRef.current = null;

            delayedCreateTimerRef.current = setTimeout(() => {
              delayedCreateTimerRef.current = null;
              if (!isNil(captured)) {
                onClickSelection?.(captured);
              }
              clearAll();
              setInitGridPosition(null);
            }, LONG_PRESS_CREATE_OPEN_DELAY);

            return; // 不立即 clearAll，让临时卡片在 200ms 内保持显示
          }

          onMouseUpWithClick(e);
          return;
        }

        // 拖拽结束事件
        onMouseup(e, false);
      },
    },
    // 触控空白网格创建走长按进入，避免与上下滚动看时段的手势冲突；鼠标即时
    { delayTouchStart: LONG_PRESS_DELAY }
  );

  return onMouseDown;
}
