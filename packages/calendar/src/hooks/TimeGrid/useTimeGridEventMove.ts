import { useCalendarStore } from '@/contexts/calendarStore';
import { GridPosition, GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { CalendarState } from '@/types/store.type';
import { useDraggingEvent } from '../event/useDraggingEvent';
import { useCurrentPointerPositionInGrid } from '../event/useCurrentPointerPositionInGrid';
import { useEffect, useMemo, useRef } from 'react';
import { isNil } from 'lodash-es';
import { addMinutes, MS_PER_DAY, MS_PER_THIRTY_MINUTES } from '@/time/datetime';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';

// 30分钟的时间间隔常量
const THIRTY_MINUTES = 30;

/**
 * 根据时间获取当前在时间网格中的索引位置
 * @param time - 目标时间
 * @param hourStart - 时间网格的起始小时
 * @returns 在时间网格中的行索引
 */
function getCurrentIndexByTime(time: DayjsTZDate, hourStart: number) {
  const hour = time.getHours() - hourStart;
  const minutes = time.getMinutes();

  // 计算在30分钟间隔网格中的位置
  return hour * 2 + Math.floor(minutes / THIRTY_MINUTES);
}

function getMovingEventPosition({
  draggingEvent,
  columnDiff,
  rowDiff,
  timeGridDataRows,
  currentDate,
}: {
  draggingEvent: EventUIModel;
  columnDiff: number;
  rowDiff: number;
  timeGridDataRows: TimeGridData['rows'];
  currentDate: DayjsTZDate;
}) {
  const rowHeight = timeGridDataRows[0].height;
  const maxHeight = rowHeight * timeGridDataRows.length;
  // 计算时间差（毫秒）
  const millisecondsDiff = rowDiff * MS_PER_THIRTY_MINUTES + columnDiff * MS_PER_DAY;
  const hourStart = Number(timeGridDataRows[0].startTime.split(':')[0]);
  // 获取事件的持续时间信息
  const { goingDuration = 0, comingDuration = 0 } = draggingEvent.model;
  // 计算包含缓冲时间的开始和结束时间
  const goingStart = addMinutes(draggingEvent.getStarts(), -goingDuration);
  const comingEnd = addMinutes(draggingEvent.getEnds(), comingDuration);
  // 计算移动后的新开始和结束时间
  const nextStart = goingStart.addMilliseconds(millisecondsDiff);
  const nextEnd = comingEnd.addMilliseconds(millisecondsDiff);

  // 计算在网格中的开始和结束索引
  const startIndex = Math.max(getCurrentIndexByTime(nextStart, hourStart), 0);
  const endIndex = Math.min(getCurrentIndexByTime(nextEnd, hourStart), timeGridDataRows.length - 1);

  // 检查是否跨日期边界
  const isStartAtPrevDate =
    nextStart.getFullYear() < currentDate.getFullYear() ||
    nextStart.getMonth() < currentDate.getMonth() ||
    nextStart.getDate() < currentDate.getDate();
  const isEndAtNextDate =
    nextEnd.getFullYear() > currentDate.getFullYear() ||
    nextEnd.getMonth() > currentDate.getMonth() ||
    nextEnd.getDate() > currentDate.getDate();

  const indexDiff = endIndex - (isStartAtPrevDate ? 0 : startIndex);

  // 计算最终的top位置和height高度
  const top = isStartAtPrevDate ? 0 : timeGridDataRows[startIndex].top;
  const height = isEndAtNextDate ? maxHeight : Math.max(indexDiff, 1) * rowHeight;

  return { top, height };
}

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

  const movingEvent = useMemo(() => {
    if (isNil(draggingEvent) || isNil(currentGridPos) || isNil(gridDiff)) {
      return null;
    }

    const clonedEvent = draggingEvent.clone();

    const { top, height } = getMovingEventPosition({
      draggingEvent: clonedEvent,
      columnDiff: gridDiff.columnDiff,
      rowDiff: gridDiff.rowDiff,
      timeGridDataRows: timeGridData.rows,
      currentDate: timeGridData.columns[currentGridPos.columnIndex].date,
    });

    // 更新事件的UI属性
    clonedEvent.setUIProps({
      left: timeGridData.columns[currentGridPos.columnIndex].left,
      width: timeGridData.columns[currentGridPos.columnIndex].width,
      top,
      height,
    });

    return clonedEvent;
  }, [currentGridPos, draggingEvent, gridDiff, timeGridData]);

  return {
    movingEvent,
    nextStartTime, // 下一个开始时间
  };
}
