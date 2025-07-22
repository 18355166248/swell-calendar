import { useCalendarStore } from '@/contexts/calendarStore';
import { GridPosition, GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { CalendarState } from '@/types/store.type';
import { useDraggingEvent } from '../event/useDraggingEvent';
import { useCurrentPointerPositionInGrid } from '../event/useCurrentPointerPositionInGrid';
import { useEffect, useMemo, useRef } from 'react';
import { isNil } from 'lodash-es';
import { MS_PER_DAY, MS_PER_THIRTY_MINUTES } from '@/time/datetime';

const initXSelector = (state: CalendarState) => state.dnd.initX;
const initYSelector = (state: CalendarState) => state.dnd.initY;

/**
 * 时间网格事件移动钩子
 * 处理时间网格中事件的拖拽移动逻辑
 * @param gridPositionFinder - 网格位置查找器
 * @param timeGridData - 时间网格数据
 * @returns 包含移动中事件和下一个开始时间的对象
 */
export function useTimeGridEventMove({
  gridPositionFinder,
  timeGridData,
}: {
  gridPositionFinder: GridPositionFinder;
  timeGridData: TimeGridData;
}) {
  // 获取拖拽初始位置
  const initX = useCalendarStore(initXSelector);
  const initY = useCalendarStore(initYSelector);

  // 获取拖拽事件状态
  const { isDraggingEnd, isDraggingCanceled, draggingEvent, clearDraggingEvent } = useDraggingEvent(
    'timeGrid',
    'move'
  );

  // 获取当前指针在网格中的位置
  const [currentGridPos, clearCurrentGridPos] = useCurrentPointerPositionInGrid(gridPositionFinder);

  // 存储初始网格位置的引用
  const initGridPosRef = useRef<GridPosition | null>(null);

  // 当初始位置变化时，计算初始网格位置
  useEffect(() => {
    if (!isNil(initX) && !isNil(initY)) {
      initGridPosRef.current = gridPositionFinder({
        clientX: initX,
        clientY: initY,
      });
    }
  }, [gridPositionFinder, initX, initY]);

  // 计算网格位置差值
  const gridDiff = useMemo(() => {
    if (isNil(initGridPosRef.current) || isNil(currentGridPos)) {
      return null;
    }

    return {
      columnDiff: currentGridPos.columnIndex - initGridPosRef.current.columnIndex,
      rowDiff: currentGridPos.rowIndex - initGridPosRef.current.rowIndex,
    };
  }, [currentGridPos]);

  // 获取拖拽事件的开始时间
  const startDateTime = useMemo(() => {
    if (isNil(draggingEvent)) {
      return null;
    }

    return draggingEvent.getStarts();
  }, [draggingEvent]);

  // 计算下一个开始时间
  const nextStartTime = useMemo(() => {
    if (isNil(gridDiff) || isNil(startDateTime)) {
      return null;
    }

    // 根据网格差值计算新的开始时间
    return startDateTime.addMilliseconds(
      gridDiff.rowDiff * MS_PER_THIRTY_MINUTES + gridDiff.columnDiff * MS_PER_DAY
    );
  }, [gridDiff, startDateTime]);
  return {
    movingEvent: null,
  };
}
