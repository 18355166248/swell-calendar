import { addTimeGridPrefix, className } from '@/constants/timeGrid-const';
import TimeColumn from './TimeColumn';
import { TimeGridData } from '@/types/grid.type';
import { cls, toPercent } from '@/helpers/css';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { isSameDate, setTimeStrToDate, toEndOfDay, toStartOfDay } from '@/time/datetime';
import { isNil, last } from 'lodash-es';
import { getTopPercentByTime } from '@/controller/time.controller';
import { useIsMounted } from '@/hooks/common/useIsMounted';
import GridLines from './GridLines';
import Column from './Column';
import { useThemeStore } from '@/contexts/themeStore';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useGridSelection } from '@/hooks/GridSelection/useGridSelection';
import { createGridPositionFinder } from '@/helpers/grid';
import { useDOMNode } from '@/hooks/common/useDOMNode';
import { timeGridSelectionHelper } from '@/helpers/gridSelection';
import { EventUIModel } from '@/model/eventUIModel';
import { isBetweenColumn } from '@/controller/column.controller';

const classNames = {
  timeGrid: cls(className),
  scrollArea: cls(addTimeGridPrefix('scroll-area')),
};

export interface TimeGridProps {
  timeGridData: TimeGridData;
  events: EventUIModel[]; // 需要在网格中显示的事件数组
}

export function TimeGrid({ timeGridData, events }: TimeGridProps) {
  const { columns } = timeGridData;

  // 获取列容器的 DOM 节点引用
  const [columnsContainer, setColumnsContainer] = useDOMNode();
  // 组件挂载状态检查
  const isMounted = useIsMounted();

  const { options } = useCalendarStore();
  const { timeGridLeft } = useThemeStore((state) => state.week);
  const { isReadOnly } = options;
  const { startDayOfWeek, narrowWeekend } = options.week;

  // 当前时间指示器的状态
  const [nowIndicatorState, setNowIndicatorState] = useState<{
    top: number; // 指示器距离顶部的百分比位置
    now: DayjsTZDate; // 当前时间
  } | null>(null);

  /**
   * 计算所有列的事件 UI 模型
   * 为每一列筛选当天的事件，并计算渲染信息（位置、重叠处理等）
   */
  const totalUIModels = useMemo(() => {
    return (
      columns
        .map(({ date }) => {
          return events
            .filter(isBetweenColumn(toStartOfDay(date), toEndOfDay(date)))
            .map((uiModel) => {
              return uiModel.clone();
            });
        })
        // 为每列的事件设置渲染信息（位置、层级、重叠处理等）
        .map((uiModelsByColumn, columnsIndex) => {
          console.log('🚀 ~ .map ~ uiModelsByColumn:', uiModelsByColumn);
        })
    );
  }, [columns, events]);

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
  });

  return (
    <div className={classNames.timeGrid}>
      <div className={classNames.scrollArea}>
        {/* 左侧时间轴 */}
        <TimeColumn timeGridRows={timeGridData.rows} nowIndicatorState={nowIndicatorState} />
        {/* 右侧时间轴 */}
        <div
          className={cls('time-columns')}
          ref={setColumnsContainer}
          style={{ left: timeGridLeft.width }}
          onMouseDown={isReadOnly ? undefined : handleMouseDown}
        >
          {/* 网格线 - 显示时间分隔线 */}
          <GridLines timeGridRows={timeGridData.rows} />

          {/* 渲染日期列 */}
          {columns.map((col, index) => (
            <Column
              key={index}
              width={toPercent(col.width)}
              columnIndex={index}
              timeGridData={timeGridData}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
