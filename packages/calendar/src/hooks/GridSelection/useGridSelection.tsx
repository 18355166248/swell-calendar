import { GridPosition, GridPositionFinder } from '@/types/grid.type';
import { useDrag } from '../common/useDrag';
import { useState, MouseEvent } from 'react';
import { isNil } from 'lodash-es';
import { DraggingState } from '@/types/dnd.type';
import { GridSelectionData, GridSelectionType } from '@/types/gridSelection.type';
import { useCalendarStore } from '@/contexts/calendarStore';

export function useGridSelection({
  type,
  gridPositionFinder,
  selectionSorter,
}: {
  type: GridSelectionType;
  gridPositionFinder: GridPositionFinder;
  selectionSorter: (initPos: GridPosition, currentPos: GridPosition) => GridSelectionData;
}) {
  const [initGridPosition, setInitGridPosition] = useState<GridPosition | null>(null);
  const { setGridSelection } = useCalendarStore((state) => state.gridSelection);

  /**
   * 根据鼠标位置设置网格选择
   * @param e 鼠标事件
   */
  const setGridSelectionByPosition = (e: MouseEvent) => {
    const gridPosition = gridPositionFinder(e);
    if (!isNil(initGridPosition) && !isNil(gridPosition)) {
      setGridSelection(type, selectionSorter(initGridPosition, gridPosition));
    }
  };

  const onMouseup = (e: MouseEvent, isClick: boolean) => {
    if (isClick) {
      setGridSelectionByPosition(e);
    } else {
      console.log('🚀 ~ onMouseup ~ isClick:', isClick);
    }
  };

  // 鼠标抬起事件处理函数 点击事件
  const onMouseUpWithClick = (e: MouseEvent) => {
    // e.detail = 1：表示单击（single click）
    // e.detail = 2：表示双击（double click）
    // e.detail = 3：表示三击（triple click）
    // const isClick = e.detail <= 1;
    onMouseup(e, true);
  };

  // 鼠标抬起事件处理函数 拖拽事件
  const onMouseUpWithDrag = (e: MouseEvent) => {
    console.log('🚀 ~ onMouseUpWithDrag ~ e:', e);
  };

  const onMouseDown = useDrag({
    onInit: (e) => {
      // 获取并记录初始网格位置
      const gridPosition = gridPositionFinder(e);
      if (!isNil(gridPosition)) {
        setInitGridPosition(gridPosition);
      }
    },
    onDragStart: (e) => {
      console.log('🚀 ~ onDragStart ~ e:', e);
    },
    onDrag: (e) => {
      // console.log('🚀 ~ onDrag ~ e:', e);
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
        onMouseUpWithDrag(e);
      }
    },
  });

  return onMouseDown;
}
