import React from 'react';
import { CalendarStoreContext, useCalendarStore } from '@/contexts/calendarStore';
import { CalendarProvider } from '@/components/CalendarProvider';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Day } from '@/components/view/Day';
import { Week } from '@/components/view/Week';
import { Month } from '@/components/view/Month';
import { Scheduler } from '@/components/view/Scheduler';
import { ViewType } from '@/types/options.type';
import { CalendarCallbacks } from '@/types/callbacks.type';
import { CalendarCallbacksProvider } from '@/contexts/calendarCallbacks';

function ViewRouter() {
  const currentView = useCalendarStore((s) => s.view.currentView);

  const viewMap: Record<ViewType, React.ReactElement> = {
    day: <Day />,
    week: <Week />,
    month: <Month />,
    scheduler: <Scheduler />,
    timeline: <Scheduler />,
  };

  return viewMap[currentView] ?? <Week />;
}

interface CalendarAppProps {
  store: CalendarStoreContext;
  callbacks?: CalendarCallbacks;
  className?: string;
  style?: React.CSSProperties;
}

export function CalendarApp({ store, callbacks, className, style }: CalendarAppProps) {
  return (
    <CalendarProvider store={store}>
      <CalendarCallbacksProvider callbacks={callbacks}>
        <div className={className} style={{ display: 'flex', flexDirection: 'column', height: '100%', ...style }}>
          <Toolbar />
          <div style={{ flex: 1, minHeight: 0 }}>
            <ViewRouter />
          </div>
        </div>
      </CalendarCallbacksProvider>
    </CalendarProvider>
  );
}
