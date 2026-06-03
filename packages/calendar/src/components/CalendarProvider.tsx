import React from 'react';

import { CalendarStoreContext, CalendarStoreProvider } from '@/contexts/calendarStore';

interface CalendarProviderProps {
  children: React.ReactNode;
  store: CalendarStoreContext;
}

export function CalendarProvider({ children, store }: CalendarProviderProps) {
  return <CalendarStoreProvider store={store}>{children}</CalendarStoreProvider>;
}

export default CalendarProvider;
