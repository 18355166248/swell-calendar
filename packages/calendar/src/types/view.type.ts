import { ViewType } from './options.type';
import DayjsTZDate from '@/time/dayjs-tzdate';

export type ViewSlice = {
  view: {
    currentView: ViewType;
    renderDate: DayjsTZDate;
  };
};
