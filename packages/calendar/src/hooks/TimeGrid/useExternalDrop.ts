import { useCallback } from 'react';

import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import {
  createExternalDropInfo,
  isBlockedExternalDrop,
  isExternalDropAllowedForResource,
} from '@/controller/scheduler.controller';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { NormalizedOptions } from '@/types/options.type';

interface UseExternalDropParams {
  enabled: boolean;
  gridPositionFinder: GridPositionFinder;
  timeGridData: TimeGridData;
  options: NormalizedOptions;
}

/**
 * 处理 HTML5 外部拖拽 drop 到 scheduler time-grid 的 hook
 *
 * 当外部元素（带 draggable="true"）被拖入 scheduler 时间网格并释放时，
 * 计算 drop 位置（日期、时间、资源）并通过回调输出完整 intent。
 *
 * 不做第三方库封装，只基于原生 HTML5 Drag and Drop API。
 */
export function useExternalDrop({
  enabled,
  gridPositionFinder,
  timeGridData,
  options,
}: UseExternalDropParams) {
  const callbacks = useCalendarCallbacks();

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;
      // 必须 preventDefault 才能触发 drop 事件
      e.preventDefault();
    },
    [enabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();

      const position = gridPositionFinder({ clientX: e.clientX, clientY: e.clientY });
      if (!position) return;

      const column = timeGridData.columns[position.columnIndex];
      if (!column) return;

      const schedulerOptions = options.scheduler;
      const globalAllow = schedulerOptions?.allowExternalDrop ?? false;
      const currentView = 'scheduler' as const;

      // 1. 检查资源级 / 全局 allowExternalDrop gate
      const { allowed, policySource } = isExternalDropAllowedForResource(
        schedulerOptions?.resources,
        column.resourceId,
        globalAllow
      );

      const dropInfo = createExternalDropInfo(timeGridData, position, e.dataTransfer);

      if (!allowed) {
        callbacks?.onExternalDropFailed?.({
          reason: 'policy',
          policySource,
          dataTransfer: dropInfo.dataTransfer,
          date: dropInfo.date,
          start: dropInfo.start,
          end: dropInfo.end,
          resourceId: dropInfo.resourceId,
        });
        return;
      }

      // 2. 检查 invalid 区间
      if (isBlockedExternalDrop(options, currentView, position, timeGridData)) {
        callbacks?.onExternalDropFailed?.({
          reason: 'invalid',
          dataTransfer: dropInfo.dataTransfer,
          date: dropInfo.date,
          start: dropInfo.start,
          end: dropInfo.end,
          resourceId: dropInfo.resourceId,
        });
        return;
      }

      // 3. 通过所有检查，触发 onExternalDrop
      callbacks?.onExternalDrop?.(dropInfo);
    },
    [enabled, gridPositionFinder, timeGridData, options, callbacks]
  );

  return { handleDragOver, handleDrop };
}
