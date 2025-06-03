import DayjsTZDate from '@/time/dayjs-tzdate';
import type { DayjsTZDateType } from '@/time/dayjs-tzdate.types';
import { ViewType } from '@/types/options.type';

export type ViewSlice = {
  view: {
    currentView: ViewType;
    renderDate: DayjsTZDateType;
  };
};

export function createViewSlice(initialView: ViewType = 'week'): ViewSlice {
  const renderDate = new DayjsTZDate();

  return {
    view: {
      currentView: initialView,
      renderDate,
    },
  };
}
