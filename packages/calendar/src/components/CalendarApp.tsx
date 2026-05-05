import React from 'react';
import { CalendarStoreContext, useCalendarStore } from '@/contexts/calendarStore';
import { Calendar } from '@/components/Calendar';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Day } from '@/components/view/Day';
import { Week } from '@/components/view/Week';
import { Month } from '@/components/view/Month';
import { Scheduler } from '@/components/view/Scheduler';
import { ViewType } from '@/types/options.type';

function ViewRouter() {
  const currentView = useCalendarStore((s) => s.view.currentView);

  const viewMap: Record<ViewType, React.ReactElement> = {
    day: <Day />,
    week: <Week />,
    month: <Month />,
    scheduler: <Scheduler />,
  };

  return viewMap[currentView] ?? <Week />;
}

interface CalendarAppProps {
  store: CalendarStoreContext;
}

export function CalendarApp({ store }: CalendarAppProps) {
  return (
    <Calendar store={store}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Toolbar />
        <div style={{ flex: 1, minHeight: 0 }}>
          <ViewRouter />
        </div>
      </div>
    </Calendar>
  );
}
