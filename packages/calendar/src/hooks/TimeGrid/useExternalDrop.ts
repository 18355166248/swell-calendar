import { useCallback } from 'react';

import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import {
  createExternalDropInfo,
  createTimeGridDropPreview,
  isBlockedExternalDrop,
  isExternalDropAllowedForResource,
} from '@/controller/scheduler.controller';
import { TimeGridDropPreview } from '@/types/dnd-preview.type';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { NormalizedOptions } from '@/types/options.type';

interface UseExternalDropParams {
  enabled: boolean;
  gridPositionFinder: GridPositionFinder;
  timeGridData: TimeGridData;
  options: NormalizedOptions;
  onPreviewChange?: (preview: TimeGridDropPreview | null) => void;
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
  onPreviewChange,
}: UseExternalDropParams) {
  const callbacks = useCalendarCallbacks();

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;
      // 必须 preventDefault 才能触发 drop 事件
      e.preventDefault();
      const position = gridPositionFinder({ clientX: e.clientX, clientY: e.clientY });
      if (!position) {
        onPreviewChange?.(null);
        return;
      }

      const column = timeGridData.columns[position.columnIndex];
      if (!column) {
        onPreviewChange?.(null);
        return;
      }

      const schedulerOptions = options.scheduler;
      const globalAllow = schedulerOptions?.allowExternalDrop ?? false;
      const { allowed } = isExternalDropAllowedForResource(
        schedulerOptions?.resources,
        column.resourceId,
        globalAllow
      );

      const status = !allowed
        ? 'policy'
        : isBlockedExternalDrop(options, 'scheduler', position, timeGridData)
          ? 'invalid'
          : 'allowed';

      onPreviewChange?.(createTimeGridDropPreview('external', status, timeGridData, position));
    },
    [enabled, gridPositionFinder, onPreviewChange, options, timeGridData]
  );

  const handleDragLeave = useCallback(() => {
    onPreviewChange?.(null);
  }, [onPreviewChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      onPreviewChange?.(null);

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
    [enabled, gridPositionFinder, timeGridData, options, callbacks, onPreviewChange]
  );

  return { handleDragOver, handleDragLeave, handleDrop };
}
