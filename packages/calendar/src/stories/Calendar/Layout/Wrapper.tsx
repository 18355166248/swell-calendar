import Calendar from '@/components/Calendar';
import { PropsWithChildren } from 'react';
import { createCalendarStore } from '@/contexts/calendarStore';

export function Wrapper({ children }: PropsWithChildren) {
  const store = createCalendarStore();

  return (
    <Calendar store={store}>
      <div style={{ position: 'absolute', inset: 0, paddingBottom: 3 }}>{children}</div>
    </Calendar>
  );
}
