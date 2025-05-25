import { ButtonHTMLAttributes, ReactNode, useMemo } from 'react';
import { useCalendarStore } from '@/contexts/calendarStore';
import { getActivePanels } from '@/helpers/view';
import { TimeGrid } from '@/components/timeGrid/timeGrid';

export interface DayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Day({ children, ...other }: DayProps): JSX.Element {
  const { options } = useCalendarStore();
  const weekOptions = options.week;
  const { narrowWeekend, hourStart, hourEnd, taskView, eventView } = weekOptions;
  const activePanels = getActivePanels(taskView, eventView);

  const timeGridData = useMemo(
    () =>
      createTimeGridData(days, {
        hourStart,
        hourEnd,
        narrowWeekend,
      }),
    [days, hourEnd, hourStart, narrowWeekend]
  );

  return (
    <div>{activePanels.includes('time') ? <TimeGrid timeGridData={timeGridData} /> : null}</div>
  );
}

Day.displayName = 'Day';
