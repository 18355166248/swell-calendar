import { ButtonHTMLAttributes, ReactNode } from 'react';
import { useCalendarStore } from '@/contexts/calendarStore';

export interface DayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Day({ children, ...other }: DayProps): JSX.Element {
  const { options } = useCalendarStore();

  return (
    <button
      type="button"
      className={options.week.narrowWeekend ? 'narrow-weekend' : 'not-narrow-weekend'}
      {...other}
    >
      {children}
    </button>
  );
}

Day.displayName = 'Day';
