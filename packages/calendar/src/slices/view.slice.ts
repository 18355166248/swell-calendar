import DayjsTZDate from '@/time/dayjs-tzdate';
import { ViewType } from '@/types/options.type';
import { ViewSlice } from '@/types/view.type';

export function createViewSlice(initialView: ViewType = 'week'): ViewSlice {
  const renderDate = new DayjsTZDate();

  return {
    view: {
      currentView: initialView,
      renderDate,
    },
  };
}
