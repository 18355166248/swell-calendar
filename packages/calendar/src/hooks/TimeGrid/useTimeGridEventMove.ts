// 导入日历状态管理store，用于获取拖拽初始位置
// 导入lodash工具函数，用于空值检查
import { isNil } from 'lodash-es';
// 导入React核心钩子
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore, useCalendarStoreInternal } from '@/contexts/calendarStore';
import { buildRecurrenceInstanceInfo } from '@/controller/recurrence-edit-scope';
import { createUpdatedTimeGridEvent } from '@/controller/scheduler.controller';
import { shouldAcceptEventChange } from '@/controller/scheduler-validation';
// 导入网格位置相关类型定义
import { getTopHeightByTime } from '@/controller/time.controller';
// 导入事件UI模型类
import { EventUIModel } from '@/model/eventUIModel';
// 导入时间处理工具函数和常量
import {
  addMinutes,
  getDateDifference,
  getRowSlotMs,
  MS_PER_DAY,
  setTimeStrToDate,
} from '@/time/datetime';
// 导入时区日期处理类
import DayjsTZDate from '@/time/dayjs-tzdate';
import {
  CommonGridColumn,
  GridPosition,
  GridPositionFinder,
  TimeGridData,
} from '@/types/grid.type';
// 导入日历状态类型定义
import { CalendarState } from '@/types/store.type';

import { useWhen } from '../common/useWhen';
// 导入当前指针在网格中位置的钩子
import { useCurrentPointerPositionInGrid } from '../event/useCurrentPointerPositionInGrid';
// 导入拖拽事件钩子，用于管理拖拽状态
import { useDraggingEvent } from '../event/useDraggingEvent';

/**
 * 计算移动中事件的位置信息
 * @param draggingEvent - 正在拖拽的事件
 * @param dateDiff - 日期差值
 * @param rowDiff - 行索引差值
 * @param timeGridDataRows - 时间网格行数据
 * @param currentDate - 当前日期
 * @returns 包含top和height的位置信息
 */
export function getMovingEventLayout({
  draggingEvent,
  dateDiff,
  rowDiff,
  timeGridDataRows,
  targetColumn,
}: {
  draggingEvent: EventUIModel;
  dateDiff: number;
  rowDiff: number;
  timeGridDataRows: TimeGridData['rows'];
  targetColumn: CommonGridColumn;
}) {
  // 计算时间差（毫秒）：行差*单行时长（吸附粒度跟随 hourDivision）+ 日期差*1天
  const slotMs = getRowSlotMs(timeGridDataRows[0]);
  const millisecondsDiff = rowDiff * slotMs + dateDiff * MS_PER_DAY;
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
  const visibleStart = setTimeStrToDate(targetColumn.date, timeGridDataRows[0].startTime);
  const visibleEnd = setTimeStrToDate(
    targetColumn.date,
    timeGridDataRows[timeGridDataRows.length - 1].endTime
  );
  const renderStart = nextStart < visibleStart ? visibleStart : nextStart;
  const renderEnd = nextEnd > visibleEnd ? visibleEnd : nextEnd;
  const { top, height } = getTopHeightByTime(renderStart, renderEnd, visibleStart, visibleEnd);

  // 返回计算出的位置信息
  return {
    // 跟手影子铺满目标列：丢弃原卡片在重叠分栏中的窄宽度与左偏移（draggingEvent.left/width），
    // 对齐 mobiscroll —— 拖拽过程中影子始终为整列满宽，松手后再按落点重新分栏
    left: targetColumn.left,
    width: targetColumn.width,
    top,
    height,
  };
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
  existingEvents,
}: {
  gridPositionFinder: GridPositionFinder;
  timeGridData: TimeGridData;
  existingEvents: EventUIModel[];
}) {
  // 从store中获取拖拽初始X坐标
  const initX = useCalendarStore(initXSelector);
  // 从store中获取拖拽初始Y坐标
  const initY = useCalendarStore(initYSelector);
  const options = useCalendarStore((state) => state.options);
  const currentView = useCalendarStore((state) => state.view.currentView);
  const callbacks = useCalendarCallbacks();
  const store = useCalendarStoreInternal();

  // 获取拖拽事件状态，包括是否正在拖拽、是否取消、拖拽事件对象和清理函数
  const { isDraggingEnd, draggingEvent, clearDraggingEvent } = useDraggingEvent(
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
      dateDiff: getDateDifference(
        timeGridData.columns[currentGridPos.columnIndex].date,
        timeGridData.columns[initGridPosRef.current.columnIndex].date
      ), // 日期差值
      rowDiff: currentGridPos.rowIndex - initGridPosRef.current.rowIndex, // 行索引差值
    };
  }, [currentGridPos, timeGridData.columns]); // 依赖项：当前网格位置

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

    // 根据网格差值计算新的开始时间：行差*单行时长（吸附粒度跟随 hourDivision）+ 日期差*1天
    const slotMs = getRowSlotMs(timeGridData.rows[0]);
    return startDateTime.addMilliseconds(
      gridDiff.rowDiff * slotMs + gridDiff.dateDiff * MS_PER_DAY
    );
  }, [gridDiff, startDateTime, timeGridData.rows]); // 依赖项：网格差值、开始时间、行数据

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
    const targetColumn = timeGridData.columns[currentGridPos.columnIndex];
    const { left, width, top, height } = getMovingEventLayout({
      draggingEvent: clonedEvent, // 克隆的事件对象
      dateDiff: gridDiff.dateDiff, // 日期差值
      rowDiff: gridDiff.rowDiff, // 行差值
      timeGridDataRows: timeGridData.rows, // 时间网格行数据
      targetColumn,
    });

    // 更新事件的UI属性（位置和尺寸）
    clonedEvent.setUIProps({
      left, // 左边界位置
      width, // 宽度
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
      !isNil(draggingEvent) && // 拖拽事件不为空
      !isNil(currentGridPos) && // 当前网格位置不为空
      !isNil(gridDiff) && // 网格差值不为空
      !isNil(nextStartTime) && // 下一个开始时间不为空
      (gridDiff.rowDiff !== 0 || gridDiff.columnDiff !== 0); // 网格差值不为0

    // 如果需要更新，则更新移动中的事件对象
    if (shouldUpdate) {
      const safeNextEndTime = nextEndTime as DayjsTZDate;

      const updatedEvent = createUpdatedTimeGridEvent(
        draggingEvent.model.toEventObject(),
        nextStartTime,
        safeNextEndTime,
        timeGridData.columns[currentGridPos.columnIndex]
      );

      if (
        shouldAcceptEventChange(options, callbacks, {
          action: 'move',
          view: currentView,
          event: updatedEvent,
          previousEvent: draggingEvent.model.toEventObject(),
          existingEvents: existingEvents.map((uiModel) => uiModel.model.toEventObject()),
          targetColumn: timeGridData.columns[currentGridPos.columnIndex],
        })
      ) {
        // 非 recurrence 事件先乐观更新内部 store，让卡片直接停在落点，消除落点回跳闪帧；
        // recurrence 走父级 applyRecurrenceEditScope 单一真源，跳过乐观更新避免误改整条序列
        const { recurrence, recurrenceParentId } = draggingEvent.model;
        if (!recurrence && !recurrenceParentId) {
          store.getState().calendar.updateEvent(updatedEvent);
        }

        callbacks?.onEventUpdate?.({
          event: updatedEvent,
          previousEvent: draggingEvent.model.toEventObject(),
          recurrenceInstance: buildRecurrenceInstanceInfo(draggingEvent.model.toEventObject()),
        });
      }
    }

    // 无论是否提交（含未移动 / 落点被拒 / 取消），拖拽结束都必须清理状态，
    // 否则 movingEvent 影子不卸载（残留重复卡片）、draggingEvent 不清空（后续无法再拖拽）
    clearState();
  }, isDraggingEnd);

  // 返回移动中的事件和下一个开始时间
  return {
    movingEvent, // 移动中的事件对象（包含更新后的位置信息）
    nextStartTime, // 下一个开始时间（移动后的新开始时间）
    nextEndTime, // 下一个结束时间（移动后的新结束时间）
  };
}
