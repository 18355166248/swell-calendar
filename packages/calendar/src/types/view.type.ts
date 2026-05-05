import { ViewType } from './options.type';
import DayjsTZDate from '@/time/dayjs-tzdate';

export type NavigateDirection = 'prev' | 'next';

export type ViewSlice = {
  view: {
    currentView: ViewType;
    renderDate: DayjsTZDate;
    setView: (view: ViewType) => void;
    navigate: (direction: NavigateDirection) => void;
    goToToday: () => void;
  };
};
