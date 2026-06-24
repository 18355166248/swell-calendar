import { isNil } from 'lodash-es';
import { MouseEvent, useRef, useState } from 'react';

import { LONG_PRESS_DELAY } from '@/constants/mouse.const';
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

  const currentGridSelectionType = DRAGGING_TYPE_CREATE.gridSelection(type);

  useTransientUpdatesCalendar<GridSelectionData | null>(
    (state) => state.gridSelection.timeGrid,
    (gridSelection) => {
      gridSelectionRef.current = gridSelection;
    }
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
    // e.detail = 1：表示单击（single click）
    // e.detail = 2：表示双击（double click）
    // e.detail = 3：表示三击（triple click）
    // const isClick = e.detail <= 1;
    onMouseup(e, true);
  };

  const onMouseDown = useDrag(
    currentGridSelectionType,
    {
      onInit: (e) => {
        // 获取并记录初始网格位置
        const gridPosition = gridPositionFinder(e);
        if (!isNil(gridPosition)) {
          setInitGridPosition(gridPosition);
        }
      },
      onDragStart: (e) => {
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
          // 如果是点击事件，使用带点击检测的处理函数
          // 这个函数会处理单击和双击的冲突，并根据配置决定是否触发事件
          onMouseUpWithClick(e);
          return;
        } else {
          // 如果是拖拽结束事件，直接调用鼠标抬起处理函数
          // 传入 false 表示这不是点击事件，而是拖拽结束事件
          onMouseup(e, false);
        }
      },
    },
    // 触控空白网格创建走长按进入，避免与上下滚动看时段的手势冲突；鼠标即时
    { delayTouchStart: LONG_PRESS_DELAY }
  );

  return onMouseDown;
}
