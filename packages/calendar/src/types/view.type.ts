import DayjsTZDate from '@/time/dayjs-tzdate';

import { DateType } from './events.type';
import { ViewType } from './options.type';

export type NavigateDirection = 'prev' | 'next';

export type ViewSlice = {
  view: {
    currentView: ViewType;
    renderDate: DayjsTZDate;
    setView: (view: ViewType) => void;
    setDate: (date: DateType) => void;
    navigate: (direction: NavigateDirection) => void;
    goToToday: () => void;
  };
};
