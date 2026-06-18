import { useCallback } from 'react';

import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { resolveExternalDrop } from '@/controller/scheduler.controller';
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
 *
 * 位置解析与校验的纯逻辑已下沉到 `resolveExternalDrop`（controller 层），
 * 与 imperative `CalendarInstance.externalDrop` 共享。
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

      const result = resolveExternalDrop({
        position: { clientX: e.clientX, clientY: e.clientY },
        gridPositionFinder,
        timeGridData,
        options,
      });

      onPreviewChange?.('preview' in result ? result.preview ?? null : null);
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

      const result = resolveExternalDrop({
        position: { clientX: e.clientX, clientY: e.clientY },
        gridPositionFinder,
        timeGridData,
        options,
        dataTransfer: e.dataTransfer,
      });

      if (result.result === 'allowed') {
        callbacks?.onExternalDrop?.(result.info);
        return;
      }

      if (result.rejection) {
        callbacks?.onExternalDropFailed?.(result.rejection);
      }
    },
    [enabled, gridPositionFinder, timeGridData, options, callbacks, onPreviewChange]
  );

  return { handleDragOver, handleDragLeave, handleDrop };
}
