import Calendar from '@/components/Calendar';
import { PropsWithChildren } from 'react';
import { CalendarStoreContext, useCalendarStore } from '@/contexts/calendarStore';
import { EventObject } from '@/types/events.type';

export function Wrapper({
  children,
  store,
  events,
}: PropsWithChildren<{ store: CalendarStoreContext; events?: EventObject[] }>) {
  const calendar = useCalendarStore((state) => state.calendar);

  if (events) {
    calendar.createEvents(events);
  }

  return (
    <Calendar store={store}>
      <div style={{ position: 'absolute', inset: 0, paddingBottom: 3 }}>{children}</div>
    </Calendar>
  );
}
