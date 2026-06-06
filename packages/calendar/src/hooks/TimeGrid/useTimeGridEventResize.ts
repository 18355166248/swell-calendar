import { findLastIndex, isNil } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ResizingEventShadowProps } from '@/components/timeGrid/ResizingEventShadow';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import { buildRecurrenceInstanceInfo } from '@/controller/recurrence-edit-scope';
import { createUpdatedTimeGridEvent } from '@/controller/scheduler.controller';
import { shouldAcceptEventChange } from '@/controller/scheduler-validation';
import { EventUIModel } from '@/model/eventUIModel';
import { addMinutes, setTimeStrToDate } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeGridRow } from '@/types/grid.type';

import { useWhen } from '../common/useWhen';
import { useCurrentPointerPositionInGrid } from '../event/useCurrentPointerPositionInGrid';
import { useDraggingEvent } from '../event/useDraggingEvent';

export function useTimeGridEventResize({
  gridPositionFinder,
  timeGridData,
  columnIndex,
  totalUIModels,
}: ResizingEventShadowProps) {
  const options = useCalendarStore((state) => state.options);
  const currentView = useCalendarStore((state) => state.view.currentView);
  const callbacks = useCalendarCallbacks();
  // 使用拖拽事件Hook，专门处理时间网格的调整大小操作
  const {
    isDraggingEnd, // 是否正在结束拖拽
    isDraggingCanceled, // 是否取消拖拽
    draggingEvent: resizingStartUIModel, // 开始调整大小时的UI模型
    resizeDirection, // resize 方向：'start' 拖顶边改开始 / 'end' 拖底边改结束
    clearDraggingEvent, // 清除拖拽事件的函数
  } = useDraggingEvent('timeGrid', 'resize');
  // 获取当前指针在网格中的位置，返回位置信息和清理函数
  const [currentGridPos, clearCurrentGridPos] = useCurrentPointerPositionInGrid(gridPositionFinder);
  // 调整大小时的引导UI模型状态
  const [guideUIModel, setGuideUIModel] = useState<EventUIModel | null>(null);

  // 清除状态
  const clearStates = useCallback(() => {
    setGuideUIModel(null);
    clearDraggingEvent();
    clearCurrentGridPos();
  }, [clearCurrentGridPos, clearDraggingEvent]);

  /**
   * 计算调整大小的基础信息
   * 包括事件的起始和结束位置、目标UI模型列等
   */
  const baseResizingInfo = useMemo(() => {
    // 如果没有开始调整大小的UI模型，返回null
    if (isNil(resizingStartUIModel)) return null;
    const { columns, rows } = timeGridData;

    // 过滤出目标列的UI模型
    const resizeTargetUIModels = totalUIModels.map((uiModels) => {
      return uiModels.filter((uiMdel) => uiMdel.cid() === resizingStartUIModel.cid());
    });

    // 找到事件开始日期的列索引（第一个包含该事件的列）
    const eventStartDateColumnIndex = resizeTargetUIModels.findIndex((row) => row.length > 0);
    const resizingStartEventUIModel = resizeTargetUIModels[
      eventStartDateColumnIndex
    ][0] as EventUIModel;

    // 获取事件的goingDuration（事件开始前的时间段）
    const { goingDuration = 0 } = resizingStartEventUIModel.model;
    // 计算渲染开始时间（考虑goingDuration）
    const renderStart = addMinutes(resizingStartEventUIModel.getStarts(), -goingDuration);

    /**
     * 查找指定日期和列索引对应的行索引
     * @param targetDate - 目标日期
     * @param targetColumnIndex - 目标列索引
     * @returns 返回一个函数，用于判断行是否包含目标日期
     */
    const findRowIndexOf =
      (targetDate: DayjsTZDate, targetColumnIndex: number) => (row: TimeGridRow) => {
        // 计算行的开始和结束时间
        const rowStartTZDate = setTimeStrToDate(columns[targetColumnIndex].date, row.startTime);
        const rowEndTZDate = setTimeStrToDate(
          timeGridData.columns[targetColumnIndex].date,
          row.endTime
        );

        // 判断目标日期是否在当前行的时间范围内
        return rowStartTZDate <= targetDate && targetDate < rowEndTZDate;
      };

    // 找到事件开始日期的行索引
    const eventStartDateRowIndex = Math.max(
      rows.findIndex(findRowIndexOf(renderStart, eventStartDateColumnIndex)),
      0
    ); // 当返回-1时，表示事件在当前视图之前开始

    // 找到事件结束日期的列索引（最后一个包含该事件的列）
    const eventEndDateColumnIndex = findLastIndex(resizeTargetUIModels, (row) => row.length > 0);
    const resizingEndEventUIModel = resizeTargetUIModels[
      eventEndDateColumnIndex
    ][0] as EventUIModel;

    // 获取事件的comingDuration（事件结束后的时间段）
    const { comingDuration = 0 } = resizingEndEventUIModel.model;
    // 计算渲染结束时间（考虑comingDuration）
    const renderEnd = addMinutes(resizingEndEventUIModel.getStarts(), comingDuration);
    // 找到事件结束日期的行索引
    let eventEndDateRowIndex = rows.findIndex(findRowIndexOf(renderEnd, eventEndDateColumnIndex)); // 当返回-1时，表示事件在当前视图之后结束
    eventEndDateRowIndex = eventEndDateRowIndex >= 0 ? eventEndDateRowIndex : rows.length - 1;

    // 返回调整大小的基础信息
    return {
      eventStartDateColumnIndex, // 事件开始日期列索引
      eventStartDateRowIndex, // 事件开始日期行索引
      eventEndDateColumnIndex, // 事件结束日期列索引
      eventEndDateRowIndex, // 事件结束日期行索引
      resizeTargetUIModels, // 调整大小的目标UI模型列
    };
  }, [resizingStartUIModel, timeGridData, totalUIModels]);

  /**
   * 判断是否可以计算引导UI模型
   * 需要所有必要的数据都存在
   */
  const canCalculateGuideUIModel =
    !isNil(baseResizingInfo) && !isNil(resizingStartUIModel) && !isNil(currentGridPos);

  // 获取一行的高度
  const oneRowHeight = useMemo(() => {
    return baseResizingInfo ? timeGridData.rows[0].height : 0;
  }, [baseResizingInfo, timeGridData.rows]);

  // 拖顶边时事件的固定结束行索引
  // baseResizingInfo.eventEndDateRowIndex 由 getStarts() 推导（对底边 resize 无影响），
  // 顶边方向需要真实结束行，故按事件模型自身占用的行数推导，避免依赖该值
  const startResizeEndRowIndex = useMemo(() => {
    if (isNil(baseResizingInfo) || isNil(resizingStartUIModel) || oneRowHeight <= 0) {
      return null;
    }

    const occupiedRows = Math.max(1, Math.round(resizingStartUIModel.height / oneRowHeight));

    return Math.min(
      baseResizingInfo.eventStartDateRowIndex + occupiedRows - 1,
      timeGridData.rows.length - 1
    );
  }, [baseResizingInfo, resizingStartUIModel, oneRowHeight, timeGridData.rows.length]);

  const nextStartTime = useMemo(() => {
    if (isNil(resizingStartUIModel)) {
      return null;
    }

    // 拖顶边：开始时间跟随指针行首（夹紧到不越过结束行，保留最小一格）
    if (resizeDirection === 'start' && canCalculateGuideUIModel && !isNil(startResizeEndRowIndex)) {
      const movingRowIndex = Math.min(currentGridPos.rowIndex, startResizeEndRowIndex);

      return setTimeStrToDate(
        timeGridData.columns[currentGridPos.columnIndex].date,
        timeGridData.rows[movingRowIndex].startTime
      );
    }

    // 拖底边：开始时间固定
    return resizingStartUIModel.getStarts();
  }, [
    resizeDirection,
    canCalculateGuideUIModel,
    resizingStartUIModel,
    currentGridPos,
    startResizeEndRowIndex,
    timeGridData.columns,
    timeGridData.rows,
  ]);

  const nextEndTime = useMemo(() => {
    // 拖顶边：结束时间固定
    if (resizeDirection === 'start') {
      return resizingStartUIModel?.getEnds() ?? null;
    }

    if (!canCalculateGuideUIModel) {
      return null;
    }

    // 拖底边：结束时间跟随指针行末（夹紧到不越过开始行）
    const movingRowIndex = Math.max(
      currentGridPos.rowIndex,
      baseResizingInfo.eventStartDateRowIndex
    );

    return setTimeStrToDate(
      timeGridData.columns[currentGridPos.columnIndex].date,
      timeGridData.rows[movingRowIndex].endTime
    );
  }, [
    resizeDirection,
    canCalculateGuideUIModel,
    resizingStartUIModel,
    currentGridPos,
    baseResizingInfo,
    timeGridData.columns,
    timeGridData.rows,
  ]);

  useEffect(() => {
    if (canCalculateGuideUIModel) {
      const { eventStartDateRowIndex, eventStartDateColumnIndex, eventEndDateColumnIndex } =
        baseResizingInfo;

      // 仅单日事件（开始和结束在同一列）且当前列为该列时计算引导
      if (
        columnIndex === eventEndDateColumnIndex &&
        eventStartDateColumnIndex === eventEndDateColumnIndex
      ) {
        // 克隆开始调整大小的UI模型
        const clonedUIModel = resizingStartUIModel.clone();
        const rows = timeGridData.rows;

        if (resizeDirection === 'start' && !isNil(startResizeEndRowIndex)) {
          // 拖顶边：top 跟随指针行首、end 固定；夹紧到最小一格（指针行不越过结束行）
          const movingRowIndex = Math.min(currentGridPos.rowIndex, startResizeEndRowIndex);
          const newTop = rows[movingRowIndex].top;
          const newHeight = Math.max(
            oneRowHeight,
            rows[startResizeEndRowIndex].top + rows[startResizeEndRowIndex].height - newTop
          );

          clonedUIModel.setUIProps({
            top: newTop,
            height: newHeight,
          });
        } else {
          // 拖底边：start 固定、高度跟随指针行末；夹紧到最小一格（指针行不越过开始行）
          const movingRowIndex = Math.max(currentGridPos.rowIndex, eventStartDateRowIndex);
          const newHeight = Math.max(
            oneRowHeight,
            rows[movingRowIndex].top - rows[eventStartDateRowIndex].top + oneRowHeight
          );

          clonedUIModel.setUIProps({
            height: newHeight,
          });
        }

        setGuideUIModel(clonedUIModel);
      }
    }
  }, [
    canCalculateGuideUIModel,
    columnIndex,
    currentGridPos,
    oneRowHeight,
    resizeDirection,
    resizingStartUIModel,
    startResizeEndRowIndex,
    timeGridData.rows,
    timeGridData.columns,
    baseResizingInfo,
  ]);

  useWhen(() => {
    // 拖顶边作用于事件开始列，拖底边作用于事件结束列
    const targetColumnIndex =
      resizeDirection === 'start'
        ? baseResizingInfo?.eventStartDateColumnIndex
        : baseResizingInfo?.eventEndDateColumnIndex;

    // 判断是否应该更新事件
    const shouldUpdate =
      !isDraggingCanceled && // 拖拽没有被取消
      !isNil(baseResizingInfo) && // 基础信息存在
      !isNil(currentGridPos) && // 当前网格位置存在
      !isNil(resizingStartUIModel) && // 开始调整大小的UI模型存在
      targetColumnIndex === columnIndex; // 当前列是方向对应的目标列

    if (shouldUpdate) {
      const columnDate = timeGridData.columns[currentGridPos.columnIndex].date;

      let nextStart = resizingStartUIModel.getStarts();
      let nextEnd = resizingStartUIModel.getEnds();

      if (resizeDirection === 'start' && !isNil(startResizeEndRowIndex)) {
        // 拖顶边：start 跟随指针行首、end 固定；夹紧到不越过结束行（最小一格）
        const movingRowIndex = Math.min(currentGridPos.rowIndex, startResizeEndRowIndex);
        nextStart = setTimeStrToDate(columnDate, timeGridData.rows[movingRowIndex].startTime);
      } else {
        // 拖底边：end 跟随指针行末、start 固定；夹紧到不越过开始行（最小一格）
        const movingRowIndex = Math.max(
          currentGridPos.rowIndex,
          baseResizingInfo.eventStartDateRowIndex
        );
        nextEnd = setTimeStrToDate(columnDate, timeGridData.rows[movingRowIndex].endTime);
      }

      const updatedEvent = createUpdatedTimeGridEvent(
        resizingStartUIModel.model.toEventObject(),
        nextStart,
        nextEnd,
        timeGridData.columns[currentGridPos.columnIndex]
      );

      if (
        shouldAcceptEventChange(options, callbacks, {
          action: 'resize',
          view: currentView,
          event: updatedEvent,
          previousEvent: resizingStartUIModel.model.toEventObject(),
          existingEvents: totalUIModels.flat().map((uiModel) => uiModel.model.toEventObject()),
          targetColumn: timeGridData.columns[currentGridPos.columnIndex],
        })
      ) {
        callbacks?.onEventUpdate?.({
          event: updatedEvent,
          previousEvent: resizingStartUIModel.model.toEventObject(),
          recurrenceInstance: buildRecurrenceInstanceInfo(
            resizingStartUIModel.model.toEventObject()
          ),
        });
      }
    }

    clearStates();
  }, isDraggingEnd);

  return {
    guideUIModel,
    nextEndTime,
    nextStartTime,
  };
}
