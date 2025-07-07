import Calendar from '@/components/Calendar';
import { PropsWithChildren } from 'react';
import { createCalendarStore } from '@/contexts/calendarStore';
import { EventObject } from '@/types/events.type';
import { useStore } from 'zustand';

let start = false;

export function Wrapper({ children, events }: PropsWithChildren<{ events?: EventObject[] }>) {
  const store = createCalendarStore();
  useStore(store, (state) => {
    if (events && events.length > 0 && !start) {
      start = true;
      state.calendar.createEvents(events);
    }
  });

  return (
    <Calendar store={store}>
      <div style={{ position: 'absolute', inset: 0, paddingBottom: 3 }}>{children}</div>
    </Calendar>
  );
}
