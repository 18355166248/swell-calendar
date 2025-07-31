import { cls } from '@/helpers/css';
import Layout from '../Layout';
import GridHeader from '../dayGridCommon/GridHeader';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useMemo } from 'react';
import { MonthOptions, Options } from '@/types/options.type';
import { isWeekend } from '@/time/datetime';
import { createDateMatrixOfMonth } from '@/helpers/grid';

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
  console.log('🚀 ~ Month ~ dayNames:', dayNames);
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


  return (
    <Layout className={cls('month')}>
      <GridHeader dayNames={[]} type="month" rowStyleInfo={[]} />
    </Layout>
  );
}
