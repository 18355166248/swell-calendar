import { ResizingEventShadowProps } from '@/components/timeGrid/ResizingEventShadow';
import { useDraggingEvent } from '../event/useDraggingEvent';
import { useCurrentPointerPositionInGrid } from '../event/useCurrentPointerPositionInGrid';
import { EventUIModel } from '@/model/eventUIModel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { findLastIndex, isNil } from 'lodash-es';
import { addMinutes, setTimeStrToDate } from '@/time/datetime';
import { useWhen } from '../common/useWhen';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeGridRow } from '@/types/grid.type';

export function useTimeGridEventResize({
  gridPositionFinder,
  timeGridData,
  columnIndex,
  totalUIModels,
}: ResizingEventShadowProps) {
  // 使用拖拽事件Hook，专门处理时间网格的调整大小操作
  const {
    isDraggingEnd, // 是否正在结束拖拽
    isDraggingCanceled, // 是否取消拖拽
    draggingEvent: resizingStartUIModel, // 开始调整大小时的UI模型
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

  useEffect(() => {
    if (canCalculateGuideUIModel) {
      const { eventStartDateRowIndex, eventStartDateColumnIndex, eventEndDateColumnIndex } =
        baseResizingInfo;

      // 判断是否为单日事件（开始和结束在同一列）
      if (
        columnIndex === eventEndDateColumnIndex &&
        eventStartDateColumnIndex === eventEndDateColumnIndex
      ) {
        // 克隆开始调整大小的UI模型
        const clonedUIModel = resizingStartUIModel.clone();

        // 计算新的高度
        // 最小高度为从事件开始行到当前指针位置的高度
        const newHeight = Math.max(
          oneRowHeight,
          timeGridData.rows[currentGridPos.rowIndex].top -
            timeGridData.rows[eventStartDateRowIndex].top
        );

        // 更新UI模型的属性
        clonedUIModel.setUIProps({
          height: newHeight,
        });

        setGuideUIModel(clonedUIModel);
      }
    }
  }, [
    canCalculateGuideUIModel,
    columnIndex,
    currentGridPos,
    oneRowHeight,
    resizingStartUIModel,
    timeGridData.rows,
    timeGridData.columns,
    baseResizingInfo,
  ]);

  useWhen(() => {
    // 判断是否应该更新事件
    const shouldUpdate =
      !isDraggingCanceled && // 拖拽没有被取消
      !isNil(baseResizingInfo) && // 基础信息存在
      !isNil(currentGridPos) && // 当前网格位置存在
      !isNil(resizingStartUIModel) && // 开始调整大小的UI模型存在
      baseResizingInfo.eventEndDateColumnIndex === columnIndex; // 当前列是事件结束列

    if (shouldUpdate) {
      // 触发更新事件
    }

    clearStates();
  }, isDraggingEnd);

  return {
    guideUIModel,
  };
}
