import { PropsWithChildren } from 'react';
import { useStore } from 'zustand';

import { CalendarProvider } from '@/components/CalendarProvider';
import { createCalendarStore } from '@/contexts/calendarStore';
import { EventObject } from '@/types/events.type';
import { Options } from '@/types/options.type';

let start = false;

export function Wrapper({
  children,
  events,
  options,
}: PropsWithChildren<{ events?: EventObject[]; options?: Options }>) {
  const store = createCalendarStore();
  useStore(store, (state) => {
    if (!start) {
      start = true;

      if (events && events.length > 0) {
        state.calendar.createEvents(events);
      }

      if (options) {
        state.options.setOptions?.(options);
      }
    }
  });

  return (
    <CalendarProvider store={store}>
      <div style={{ position: 'absolute', inset: 0, paddingBottom: 3 }}>{children}</div>
    </CalendarProvider>
  );
}
