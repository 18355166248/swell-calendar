import { DayjsTZDateType } from '@/time/dayjs-tzdate.types';
import { ViewType } from './options.type';

export type ViewSlice = {
  view: {
    currentView: ViewType;
    renderDate: DayjsTZDateType;
  };
};
