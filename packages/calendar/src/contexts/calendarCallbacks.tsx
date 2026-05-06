import { CalendarCallbacks } from '@/types/callbacks.type';
import { createContext, useContext } from 'react';

const CalendarCallbacksContext = createContext<CalendarCallbacks | null>(null);

export function CalendarCallbacksProvider({
  children,
  callbacks,
}: {
  children: React.ReactNode;
  callbacks?: CalendarCallbacks;
}) {
  return (
    <CalendarCallbacksContext.Provider value={callbacks ?? null}>
      {children}
    </CalendarCallbacksContext.Provider>
  );
}

export function useCalendarCallbacks() {
  return useContext(CalendarCallbacksContext);
}
