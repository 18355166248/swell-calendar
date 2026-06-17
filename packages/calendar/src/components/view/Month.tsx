import { useMemo } from 'react';

import { useCalendarStore } from '@/contexts/calendarStore';
import { getMonthDayNames, getMonthEventRows, getMonthWeeks } from '@/controller/month.controller';
import { getRowStyleInfo } from '@/time/datetime';
import { MonthOptions } from '@/types/options.type';

import GridHeader from '../dayGridCommon/GridHeader';
import Layout from '../Layout';
import { MonthGrid } from '../month/MonthGrid';
import Panel from '../Panel';

const MONTH_DAY_NAME_HEIGHT = 31;
const VISIBLE_EVENT_COUNT = 4;

function useMonthViewState() {
  const { options, view } = useCalendarStore();
  const { renderDate } = view;

  return useMemo(
    () => ({
      options,
      renderDate,
    }),
    [options, renderDate]
  );
}

export function Month() {
  const { options, renderDate } = useMonthViewState();
  const calendar = useCalendarStore((state) => state.calendar);
  const dayNames = getMonthDayNames(options);
  const monthOptions = options.month as Required<MonthOptions>;
  const { narrowWeekend, startDayOfWeek, workweek } = monthOptions;

  /**
   * 计算月视图的周布局
   * 使用 getMonthWeeks 生成完整的 7 天周矩阵
   */
  const weeks = useMemo(() => getMonthWeeks(renderDate, monthOptions), [monthOptions, renderDate]);

  /**
   * 计算事件布局（每个事件的列位置、跨度和行索引）
   * 使用 getMonthEventRows 处理碰撞检测和溢出计算
   */
  const eventRows = useMemo(
    () => getMonthEventRows(calendar, weeks, VISIBLE_EVENT_COUNT),
    [calendar, weeks]
  );

  /**
   * 计算行样式信息和单元格宽度映射
   */
  const { rowStyleInfo } = useMemo(() => {
    return getRowStyleInfo(dayNames.length, narrowWeekend, startDayOfWeek, workweek);
  }, [dayNames.length, narrowWeekend, startDayOfWeek, workweek]);

  return (
    <Layout className="month-view">
      <Panel name="month-day-names" initialHeight={MONTH_DAY_NAME_HEIGHT}>
        <GridHeader dayNames={dayNames} type="month" rowStyleInfo={rowStyleInfo} />
      </Panel>
      <Panel name="month-grid">
        <MonthGrid
          weeks={weeks}
          eventRows={eventRows}
          renderDate={renderDate}
          visibleEventCount={VISIBLE_EVENT_COUNT}
          totalCols={dayNames.length}
          colWidths={rowStyleInfo.map((style) => style.width)}
        />
      </Panel>
    </Layout>
  );
}
