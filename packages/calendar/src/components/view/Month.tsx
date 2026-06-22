import { useMemo } from 'react';

import { useCalendarStore } from '@/contexts/calendarStore';
import { getMonthDayNames, getMonthEventRows, getMonthWeeks } from '@/controller/month.controller';
import { useViewportTier } from '@/hooks/common/useViewportTier';
import { getRowStyleInfo } from '@/time/datetime';
import { MonthOptions } from '@/types/options.type';
import { getTierClassName } from '@/utils/viewport';

import GridHeader from '../dayGridCommon/GridHeader';
import Layout from '../Layout';
import { MonthGrid } from '../month/MonthGrid';
import Panel from '../Panel';

const MONTH_DAY_NAME_HEIGHT = 31;
const MONTH_MOBILE_CELL_HEADER_HEIGHT = 44;
const MONTH_MOBILE_CELL_EVENT_HEIGHT = 16;

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
  const maxEventStack = monthOptions.maxEventStack;
  const [viewportTier, setViewportRef] = useViewportTier();
  // 移动端日期头包含农历第二行，事件层定位必须同步抬高，
  // 否则事件 chip 会压到日期文本；桌面继续使用 MonthGrid 默认高度。
  const cellHeaderHeight = viewportTier === 'mobile' ? MONTH_MOBILE_CELL_HEADER_HEIGHT : undefined;
  // 矮屏月格需要同时收紧事件步进，否则 `+N 更多` 会被 3 条 chip 挤出单元格底部。
  const cellEventHeight = viewportTier === 'mobile' ? MONTH_MOBILE_CELL_EVENT_HEIGHT : undefined;

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
    () => getMonthEventRows(calendar, weeks, maxEventStack),
    [calendar, maxEventStack, weeks]
  );

  /**
   * 计算行样式信息和单元格宽度映射
   */
  const { rowStyleInfo } = useMemo(() => {
    return getRowStyleInfo(dayNames.length, narrowWeekend, startDayOfWeek, workweek);
  }, [dayNames.length, narrowWeekend, startDayOfWeek, workweek]);

  return (
    <Layout className={getTierClassName('month-view', viewportTier)} rootRef={setViewportRef}>
      <Panel name="month-day-names" initialHeight={MONTH_DAY_NAME_HEIGHT}>
        <GridHeader dayNames={dayNames} type="month" rowStyleInfo={rowStyleInfo} />
      </Panel>
      <Panel name="month-grid">
        <MonthGrid
          weeks={weeks}
          eventRows={eventRows}
          renderDate={renderDate}
          visibleEventCount={maxEventStack}
          totalCols={dayNames.length}
          colWidths={rowStyleInfo.map((style) => style.width)}
          cellHeaderHeight={cellHeaderHeight}
          cellEventHeight={cellEventHeight}
        />
      </Panel>
    </Layout>
  );
}
