// 导入日历状态管理store，用于获取拖拽初始位置
import { useCalendarStore } from '@/contexts/calendarStore';
// 导入网格位置相关类型定义
import { GridPosition, GridPositionFinder, TimeGridData } from '@/types/grid.type';
// 导入日历状态类型定义
import { CalendarState } from '@/types/store.type';
// 导入拖拽事件钩子，用于管理拖拽状态
import { useDraggingEvent } from '../event/useDraggingEvent';
// 导入当前指针在网格中位置的钩子
import { useCurrentPointerPositionInGrid } from '../event/useCurrentPointerPositionInGrid';
// 导入React核心钩子
import { useCallback, useEffect, useMemo, useRef } from 'react';
// 导入lodash工具函数，用于空值检查
import { isNil } from 'lodash-es';
// 导入时间处理工具函数和常量
import { addMinutes, MS_PER_DAY, MS_PER_THIRTY_MINUTES } from '@/time/datetime';
// 导入事件UI模型类
import { EventUIModel } from '@/model/eventUIModel';
// 导入时区日期处理类
import DayjsTZDate from '@/time/dayjs-tzdate';
import { useWhen } from '../common/useWhen';

// 定义30分钟的时间间隔常量，用于网格计算
const THIRTY_MINUTES = 30;

/**
 * 根据时间获取当前在时间网格中的索引位置
 * @param time - 目标时间
 * @param hourStart - 时间网格的起始小时
 * @returns 在时间网格中的行索引
 */
function getCurrentIndexByTime(time: DayjsTZDate, hourStart: number) {
  // 计算相对于起始小时的小时差
  const hour = time.getHours() - hourStart;
  // 获取分钟数
  const minutes = time.getMinutes();

  // 计算在30分钟间隔网格中的位置：每小时2行（30分钟一行）
  return hour * 2 + Math.floor(minutes / THIRTY_MINUTES);
}

/**
 * 计算移动中事件的位置信息
 * @param draggingEvent - 正在拖拽的事件
 * @param columnDiff - 列索引差值
 * @param rowDiff - 行索引差值
 * @param timeGridDataRows - 时间网格行数据
 * @param currentDate - 当前日期
 * @returns 包含top和height的位置信息
 */
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
  // 获取单行高度
  const rowHeight = timeGridDataRows[0].height;
  // 计算网格最大高度
  const maxHeight = rowHeight * timeGridDataRows.length;
  // 计算时间差（毫秒）：行差*30分钟 + 列差*1天
  const millisecondsDiff = rowDiff * MS_PER_THIRTY_MINUTES + columnDiff * MS_PER_DAY;
  // 从第一行数据中提取起始小时
  const hourStart = Number(timeGridDataRows[0].startTime.split(':')[0]);
  // 获取事件的持续时间信息（缓冲时间）
  const { goingDuration = 0, comingDuration = 0 } = draggingEvent.model;
  // 计算包含缓冲时间的开始时间（减去going缓冲时间）
  const goingStart = addMinutes(draggingEvent.getStarts(), -goingDuration);
  // 计算包含缓冲时间的结束时间（加上coming缓冲时间）
  const comingEnd = addMinutes(draggingEvent.getEnds(), comingDuration);
  // 计算移动后的新开始时间
  const nextStart = goingStart.addMilliseconds(millisecondsDiff);
  // 计算移动后的新结束时间
  const nextEnd = comingEnd.addMilliseconds(millisecondsDiff);

  // 计算在网格中的开始索引，确保不小于0
  const startIndex = Math.max(getCurrentIndexByTime(nextStart, hourStart), 0);
  // 计算在网格中的结束索引，确保不超过最大行数
  const endIndex = Math.min(getCurrentIndexByTime(nextEnd, hourStart), timeGridDataRows.length - 1);

  // 检查是否跨日期边界：开始时间是否在前一天
  const isStartAtPrevDate =
    nextStart.getFullYear() < currentDate.getFullYear() ||
    nextStart.getMonth() < currentDate.getMonth() ||
    nextStart.getDate() < currentDate.getDate();
  // 检查是否跨日期边界：结束时间是否在后一天
  const isEndAtNextDate =
    nextEnd.getFullYear() > currentDate.getFullYear() ||
    nextEnd.getMonth() > currentDate.getMonth() ||
    nextEnd.getDate() > currentDate.getDate();

  // 计算索引差值，如果开始时间在前一天则从0开始计算
  const indexDiff = endIndex - (isStartAtPrevDate ? 0 : startIndex);

  // 计算最终的top位置：如果开始时间在前一天则从0开始，否则使用计算出的开始位置
  const top = isStartAtPrevDate ? 0 : timeGridDataRows[startIndex].top;
  // 计算最终的高度：如果结束时间在后一天则使用最大高度，否则使用计算出的高度
  const height = isEndAtNextDate ? maxHeight : Math.max(indexDiff, 1) * rowHeight;

  // 返回计算出的位置信息
  return { top, height };
}

// 选择器：从状态中获取拖拽初始X坐标
const initXSelector = (state: CalendarState) => state.dnd.initX;
// 选择器：从状态中获取拖拽初始Y坐标
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
  // 从store中获取拖拽初始X坐标
  const initX = useCalendarStore(initXSelector);
  // 从store中获取拖拽初始Y坐标
  const initY = useCalendarStore(initYSelector);

  // 获取拖拽事件状态，包括是否正在拖拽、是否取消、拖拽事件对象和清理函数
  const { isDraggingEnd, isDraggingCanceled, draggingEvent, clearDraggingEvent } = useDraggingEvent(
    'timeGrid', // 拖拽类型：时间网格
    'move' // 拖拽模式：移动
  );

  // 获取当前指针在网格中的位置，返回位置信息和清理函数
  const [currentGridPos, clearCurrentGridPos] = useCurrentPointerPositionInGrid(gridPositionFinder);

  // 创建引用存储初始网格位置，用于计算位置差值
  const initGridPosRef = useRef<GridPosition | null>(null);

  // 当初始位置变化时，计算并存储初始网格位置
  useEffect(() => {
    // 确保初始坐标不为空
    if (!isNil(initX) && !isNil(initY)) {
      // 使用网格位置查找器计算初始网格位置
      initGridPosRef.current = gridPositionFinder({
        clientX: initX, // 初始X坐标
        clientY: initY, // 初始Y坐标
      });
    }
  }, [gridPositionFinder, initX, initY]); // 依赖项：查找器函数和初始坐标

  // 计算网格位置差值（当前位置 - 初始位置）
  const gridDiff = useMemo(() => {
    // 如果初始位置或当前位置为空，返回null
    if (isNil(initGridPosRef.current) || isNil(currentGridPos)) {
      return null;
    }

    // 返回列差和行差
    return {
      columnDiff: currentGridPos.columnIndex - initGridPosRef.current.columnIndex, // 列索引差值
      rowDiff: currentGridPos.rowIndex - initGridPosRef.current.rowIndex, // 行索引差值
    };
  }, [currentGridPos]); // 依赖项：当前网格位置

  // 获取拖拽事件的开始时间
  const startDateTime = useMemo(() => {
    // 如果拖拽事件为空，返回null
    if (isNil(draggingEvent)) {
      return null;
    }

    // 返回事件的开始时间
    return draggingEvent.getStarts();
  }, [draggingEvent]); // 依赖项：拖拽事件

  // 计算下一个开始时间（移动后的新开始时间）
  const nextStartTime = useMemo(() => {
    // 如果网格差值或开始时间为空，返回null
    if (isNil(gridDiff) || isNil(startDateTime)) {
      return null;
    }

    // 根据网格差值计算新的开始时间：行差*30分钟 + 列差*1天
    return startDateTime.addMilliseconds(
      gridDiff.rowDiff * MS_PER_THIRTY_MINUTES + gridDiff.columnDiff * MS_PER_DAY
    );
  }, [gridDiff, startDateTime]); // 依赖项：网格差值和开始时间

  const nextEndTime = useMemo(() => {
    if (isNil(nextStartTime)) {
      return null;
    }
    return nextStartTime.addMilliseconds(draggingEvent?.model.duration() ?? 0);
  }, [nextStartTime, draggingEvent]);

  // 清理状态的函数
  const clearState = useCallback(() => {
    clearCurrentGridPos();
    clearDraggingEvent();
    initGridPosRef.current = null;
  }, [clearCurrentGridPos, clearDraggingEvent]);

  // 计算移动中的事件对象（包含更新后的位置信息）
  const movingEvent = useMemo(() => {
    // 如果拖拽事件、当前网格位置或网格差值为空，返回null
    if (isNil(draggingEvent) || isNil(currentGridPos) || isNil(gridDiff)) {
      return null;
    }

    // 克隆拖拽事件，避免修改原对象
    const clonedEvent = draggingEvent.clone();

    // 计算移动后的位置信息
    const { top, height } = getMovingEventPosition({
      draggingEvent: clonedEvent, // 克隆的事件对象
      columnDiff: gridDiff.columnDiff, // 列差值
      rowDiff: gridDiff.rowDiff, // 行差值
      timeGridDataRows: timeGridData.rows, // 时间网格行数据
      currentDate: timeGridData.columns[currentGridPos.columnIndex].date, // 当前列对应的日期
    });

    // 更新事件的UI属性（位置和尺寸）
    clonedEvent.setUIProps({
      left: timeGridData.columns[currentGridPos.columnIndex].left, // 左边界位置
      width: timeGridData.columns[currentGridPos.columnIndex].width, // 宽度
      top, // 顶部位置
      height, // 高度
    });

    // 返回更新后的事件对象
    return clonedEvent;
  }, [currentGridPos, draggingEvent, gridDiff, timeGridData]); // 依赖项：当前网格位置、拖拽事件、网格差值、时间网格数据

  // 当拖拽结束时，更新移动中的事件对象
  useWhen(() => {
    // 检查是否需要更新移动中的事件对象
    const shouldUpdate =
      !isDraggingCanceled && // 拖拽未取消
      !isNil(draggingEvent) && // 拖拽事件不为空
      !isNil(currentGridPos) && // 当前网格位置不为空
      !isNil(gridDiff) && // 网格差值不为空
      !isNil(nextStartTime) && // 下一个开始时间不为空
      (gridDiff.rowDiff !== 0 || gridDiff.columnDiff !== 0); // 网格差值不为0

    // 如果需要更新，则更新移动中的事件对象
    if (shouldUpdate) {
      // 计算新的结束时间
      const duration = draggingEvent.model.duration();
      const nextEndTime = nextStartTime.addMilliseconds(duration);

      console.log('拖拽结束, 清理状态');

      clearState();
    }
  }, isDraggingEnd);

  // 返回移动中的事件和下一个开始时间
  return {
    movingEvent, // 移动中的事件对象（包含更新后的位置信息）
    nextStartTime, // 下一个开始时间（移动后的新开始时间）
    nextEndTime, // 下一个结束时间（移动后的新结束时间）
  };
}
