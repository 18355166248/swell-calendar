import { ButtonHTMLAttributes, ReactNode, useMemo } from 'react';
import { useCalendarStore } from '@/contexts/calendarStore';
import { getActivePanels } from '@/helpers/view';
import { TimeGrid } from '@/components/timeGrid/TimeGrid';
import { useThemeStore } from '@/contexts/themeStore';

export interface DayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Day({ children, ...other }: DayProps): JSX.Element {
  const { options } = useCalendarStore();
  const { week } = useThemeStore();
  console.log('🚀 ~ Day ~ week:', week);
  const weekOptions = options.week;
  const { narrowWeekend, hourStart, hourEnd, taskView, eventView } = weekOptions;
  const activePanels = getActivePanels(taskView, eventView);

  return <div>{activePanels.includes('time') ? <TimeGrid /> : null}</div>;
}

Day.displayName = 'Day';
