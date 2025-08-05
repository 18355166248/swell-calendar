import { cls } from '@/helpers/css';
import Layout from '../Layout';
import GridHeader from '../dayGridCommon/GridHeader';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useMemo } from 'react';
import { MonthOptions, Options } from '@/types/options.type';
import { getRowStyleInfo, isWeekend } from '@/time/datetime';
import { createDateMatrixOfMonth } from '@/helpers/grid';
import DayGridMonth from '../dayGridMonth/DayGridMonth';

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

function getMonthDayNames(options: Options) {
  const { dayNames, startDayOfWeek, workweek } = options.month as Required<MonthOptions>;
  const dayIndices = [...Array(7)].map((_, i) => (startDayOfWeek + i) % 7);
  const monthDayNames = dayIndices.map((name, index) => ({
    day: index,
    label: dayNames[index],
  }));
  return monthDayNames.filter((v) => (workweek ? !isWeekend(v.day) : true));
}

export function Month() {
  const { options, renderDate } = useMonthViewState();
  const dayNames = getMonthDayNames(options);
  const monthOptions = options.month as Required<MonthOptions>;
  const { narrowWeekend, startDayOfWeek, workweek } = monthOptions;

  /**
   * 创建月视图的日期矩阵
   * 使用 useMemo 优化性能，只有当月份选项或渲染日期变化时才重新计算
   */
  const dateMatrix = useMemo(
    () => createDateMatrixOfMonth(renderDate, monthOptions),
    [monthOptions, renderDate]
  );

  /**
   * 计算行样式信息和单元格宽度映射
   * 使用 useMemo 优化性能，只有当相关配置变化时才重新计算
   */
  const { rowStyleInfo, cellWidthMap } = useMemo(() => {
    return getRowStyleInfo(dayNames.length, narrowWeekend, startDayOfWeek, workweek);
  }, [dayNames.length, narrowWeekend, startDayOfWeek, workweek]);

  /**
   * 创建行信息数组，将样式信息与对应的日期结合
   * 每行包含样式信息和该行对应的日期信息
   */
  const rowInfo = useMemo(() => {
    return rowStyleInfo.map((row, index) => ({
      ...row,
      date: dateMatrix[0][index],
    }));
  }, [dateMatrix, rowStyleInfo]);

  return (
    <Layout className="month">
      <GridHeader dayNames={dayNames} type="month" rowStyleInfo={rowStyleInfo} />
      {/* 渲染日期网格 */}
      <DayGridMonth dateMatrix={dateMatrix} rowInfo={rowInfo} cellWidthMap={cellWidthMap} />
    </Layout>
  );
}
