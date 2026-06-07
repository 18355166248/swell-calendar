import { isNil, last } from 'lodash-es';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';

import { addTimeGridPrefix, className } from '@/constants/timeGrid-const';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useThemeStore } from '@/contexts/themeStore';
import { isBetweenColumn, setRenderInfoOfUIModels } from '@/controller/column.controller';
import {
  createEventFromTimeGridSelection,
  createRangeSelectionInfo,
  getBlockedTimeLayoutsForColumn,
} from '@/controller/scheduler.controller';
import {
  compareSchedulerEventsByOrder,
  getColoredLayoutsForColumn,
} from '@/controller/scheduler-layout';
import { shouldAcceptEventChange } from '@/controller/scheduler-validation';
import { getTopPercentByTime } from '@/controller/time.controller';
import { cls, toPercent } from '@/helpers/css';
import { createGridPositionFinder } from '@/helpers/grid';
import { timeGridSelectionHelper } from '@/helpers/gridSelection';
import { useDOMNode } from '@/hooks/common/useDOMNode';
import { useIsMounted } from '@/hooks/common/useIsMounted';
import { useGridSelection } from '@/hooks/GridSelection/useGridSelection';
import { useCrossInstanceDnD } from '@/hooks/TimeGrid/useCrossInstanceDnD';
import { useExternalDrop } from '@/hooks/TimeGrid/useExternalDrop';
import { EventUIModel } from '@/model/eventUIModel';
import { isSameDate, setTimeStrToDate, toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { TimeGridDropPreview } from '@/types/dnd-preview.type';
import { CommonGridColumn, TimeGridData } from '@/types/grid.type';

import Column from './Column';
import DropPreviewShadow from './DropPreviewShadow';
import GridLines from './GridLines';
import MovingEventShadow from './MovingEventShadow';
import NowIndicatorLine from './NowIndicatorLine';
import TimeColumn from './TimeColumn';

const classNames = {
  timeGrid: cls(className),
  scrollArea: cls(addTimeGridPrefix('scroll-area')),
};

export interface TimeGridProps {
  timeGridData: TimeGridData;
  events: EventUIModel[]; // 需要在网格中显示的事件数组
}

function isSameResourceColumn(column: CommonGridColumn, uiModel: EventUIModel) {
  if (!column.resourceId) {
    return true;
  }

  const resourceId = uiModel.model.getResourceId();
  const resourceIds = uiModel.model.toEventObject().resourceIds ?? [];

  return resourceId === column.resourceId || resourceIds.includes(column.resourceId);
}

export function TimeGrid({ timeGridData, events }: TimeGridProps) {
  const { columns } = timeGridData;

  // 获取列容器的 DOM 节点引用
  const [columnsContainer, setColumnsContainer] = useDOMNode();
  // 获取最外层容器的 DOM 节点引用（用于跨实例拖拽边界检测）
  const [timeGridContainer, setTimeGridContainer] = useDOMNode();
  // 组件挂载状态检查
  const isMounted = useIsMounted();

  const { options } = useCalendarStore();
  const currentView = useCalendarStore((state) => state.view.currentView);
  const { timeGridLeft, showNowIndicator } = useThemeStore((state) => state.week);
  const { isReadOnly } = options;
  const { startDayOfWeek, narrowWeekend } = options.week;
  const callbacks = useCalendarCallbacks();

  // 副时区轴（仅 scheduler 视图生效）：每多一个时区，gutter 增宽一个基础轴宽
  const timezones = currentView === 'scheduler' ? options.scheduler?.timezones ?? [] : [];
  const primaryTimezone =
    currentView === 'scheduler' ? options.scheduler?.displayTimezone : undefined;
  const baseGutterWidth = parseInt(`${timeGridLeft.width}`, 10) || 72;
  const gutterWidth =
    timezones.length > 0 ? `${baseGutterWidth * (timezones.length + 1)}px` : timeGridLeft.width;

  // 当前时间指示器的状态
  const [nowIndicatorState, setNowIndicatorState] = useState<{
    top: number; // 指示器距离顶部的百分比位置
    now: DayjsTZDate; // 当前时间
  } | null>(null);
  const [dropPreview, setDropPreview] = useState<TimeGridDropPreview | null>(null);

  /**
   * 计算所有列的事件 UI 模型
   * 为每一列筛选当天的事件，并计算渲染信息（位置、重叠处理等）
   */
  const totalUIModels = useMemo(() => {
    const eventSorter = currentView === 'scheduler' ? compareSchedulerEventsByOrder : undefined;

    return (
      columns
        .map((column) => {
          return events
            .filter((uiModel) =>
              isBetweenColumn(toStartOfDay(column.date), toEndOfDay(column.date))(uiModel)
            )
            .filter((uiModel) => isSameResourceColumn(column, uiModel))
            .map((uiModel) => {
              return uiModel.clone();
            });
        })
        // 为每列的事件设置渲染信息（位置、层级、重叠处理等）
        .map((uiModelsByColumn, columnsIndex) => {
          return setRenderInfoOfUIModels(
            uiModelsByColumn,
            setTimeStrToDate(columns[columnsIndex].date, timeGridData.rows[0].startTime),
            setTimeStrToDate(
              columns[columnsIndex].date,
              timeGridData.rows[timeGridData.rows.length - 1].endTime
            ),
            eventSorter
          );
        })
    );
  }, [columns, currentView, events, timeGridData.rows]);

  const blockedLayoutsByColumn = useMemo(() => {
    return columns.map((column) =>
      getBlockedTimeLayoutsForColumn(options, currentView, timeGridData, column)
    );
  }, [columns, currentView, options, timeGridData]);

  const coloredLayoutsByColumn = useMemo(() => {
    return columns.map((column) =>
      getColoredLayoutsForColumn(options, currentView, timeGridData, column)
    );
  }, [columns, currentView, options, timeGridData]);

  /**
   * 计算当前日期相关数据
   * 用于确定是否需要显示当前时间指示器
   */
  const currentDateData = useMemo(() => {
    const now = new DayjsTZDate().local();
    const currentDateIndexInColumns = columns.findIndex((col) => isSameDate(col.date, now));
    if (currentDateIndexInColumns < 0) return null;

    const startTime = setTimeStrToDate(
      columns[currentDateIndexInColumns].date,
      timeGridData.rows[0].startTime
    );

    const endTime = setTimeStrToDate(
      columns[currentDateIndexInColumns].date,
      last(timeGridData.rows)!.endTime
    );

    return {
      startTime,
      endTime,
      currentDateIndex: currentDateIndexInColumns,
    };
  }, [columns, timeGridData.rows]);

  // 网格位置查找器
  const gridPositionFinder = useMemo(
    () =>
      createGridPositionFinder({
        rowsCount: timeGridData.rows.length,
        columnsCount: columns.length,
        container: columnsContainer,
        narrowWeekend,
        startDayOfWeek,
      }),
    [timeGridData.rows.length, columns.length, columnsContainer, narrowWeekend, startDayOfWeek]
  );

  /**
   * 更新时间指示器位置
   * 计算当前时间在网格中的垂直位置百分比
   */
  const updateTimeIndicatorPosition = useCallback(() => {
    if (!isNil(currentDateData)) {
      const { startTime, endTime } = currentDateData;
      const now = new DayjsTZDate().local();
      if (startTime <= now && now <= endTime) {
        setNowIndicatorState({
          top: getTopPercentByTime(now, startTime, endTime),
          now,
        });
      }
    }
  }, [currentDateData]);

  useLayoutEffect(() => {
    if (isMounted()) {
      if ((currentDateData?.currentDateIndex ?? -1) >= 0) {
        updateTimeIndicatorPosition();
      } else {
        setNowIndicatorState(null);
      }
    }
  }, [isMounted, updateTimeIndicatorPosition, currentDateData]);

  /**
   * 网格选择处理函数
   * 处理鼠标拖拽选择时间范围的逻辑
   */
  const handleMouseDown = useGridSelection({
    type: 'timeGrid',
    gridPositionFinder,
    selectionSorter: timeGridSelectionHelper.sortSelection, // 选择排序器
    onClickSelection: (selection) => {
      if (currentView === 'scheduler') {
        callbacks?.onCellClick?.(createRangeSelectionInfo(timeGridData, selection, currentView));
      }
    },
    onSelectionEnd: (selection) => {
      const event = createEventFromTimeGridSelection(timeGridData, selection);

      callbacks?.onRangeSelect?.(createRangeSelectionInfo(timeGridData, selection, currentView));

      if (
        shouldAcceptEventChange(options, callbacks, {
          action: 'create',
          view: currentView,
          event,
          existingEvents: events.map((uiModel) => uiModel.model.toEventObject()),
        })
      ) {
        callbacks?.onEventCreate?.({ event });
      }
    },
  });

  const { handleDragOver, handleDragLeave, handleDrop } = useExternalDrop({
    enabled:
      currentView === 'scheduler' && !isReadOnly && (options.scheduler?.allowExternalDrop ?? false),
    gridPositionFinder,
    timeGridData,
    options,
    onPreviewChange: setDropPreview,
  });

  useCrossInstanceDnD({
    enabled: currentView === 'scheduler' && !isReadOnly,
    containerEl: timeGridContainer,
    gridPositionFinder,
    timeGridData,
    onPreviewChange: setDropPreview,
  });

  return (
    <div className={classNames.timeGrid} ref={setTimeGridContainer}>
      <div className={classNames.scrollArea}>
        {/* 左侧时间轴 */}
        <TimeColumn
          timeGridRows={timeGridData.rows}
          nowIndicatorState={nowIndicatorState}
          timezones={timezones}
          primaryTimezone={primaryTimezone}
          width={gutterWidth}
        />
        {/* 右侧时间轴 */}
        <div
          className={cls('time-columns')}
          ref={setColumnsContainer}
          style={{ left: gutterWidth }}
          onMouseDown={isReadOnly ? undefined : handleMouseDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 网格线 - 显示时间分隔线 */}
          <GridLines timeGridRows={timeGridData.rows} />

          {/* 已有事件时间拖拽时的预览效果 */}
          <MovingEventShadow
            gridPositionFinder={gridPositionFinder}
            timeGridData={timeGridData}
            events={events}
          />
          <DropPreviewShadow preview={dropPreview} timeGridData={timeGridData} />

          {/* 渲染日期列 */}
          {columns.map((col, index) => (
            <Column
              key={index}
              width={toPercent(col.width)}
              columnIndex={index}
              timeGridData={timeGridData}
              columnDate={col.date}
              totalUIModels={totalUIModels}
              gridPositionFinder={gridPositionFinder}
              isLastColumn={index === columns.length - 1}
              blockedLayouts={blockedLayoutsByColumn[index]}
              coloredLayouts={coloredLayoutsByColumn[index]}
            />
          ))}

          {/* 当前时间指示线 - 横跨所有日期列 */}
          {showNowIndicator && !isNil(nowIndicatorState) && (
            <NowIndicatorLine top={nowIndicatorState.top} />
          )}
        </div>
      </div>
    </div>
  );
}
