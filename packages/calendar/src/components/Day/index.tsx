import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface DayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Day({ children, ...other }: DayProps): JSX.Element {
  return (
    <button type="button" {...other}>
      {children}
    </button>
  );
}

Day.displayName = 'Day';
