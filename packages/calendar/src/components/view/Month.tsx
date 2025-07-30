import { cls } from '@/helpers/css';
import Layout from '../Layout';
import GridHeader from '../dayGridCommon/GridHeader';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useMemo } from 'react';
import { MonthOptions, Options } from '@/types/options.type';

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
}

export function Month() {
  const { options, renderDate } = useMonthViewState();
  const dayNames = getMonthDayNames(options);
  return (
    <Layout className={cls('month')}>
      <GridHeader dayNames={[]} type="month" rowStyleInfo={[]} />
    </Layout>
  );
}
