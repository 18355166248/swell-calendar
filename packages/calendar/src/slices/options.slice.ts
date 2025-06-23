import { Day } from '@/time/datetime';
import { Options, OptionsSlice } from '@/types/options.type';
import { CalendarWeekOptions } from '@/types/store.type';

function initializeWeekOptions(weekOptions: Options['week'] = {}): CalendarWeekOptions {
  const week: CalendarWeekOptions = {
    startDayOfWeek: Day.SUN,
    dayNames: [],
    narrowWeekend: false,
    workweek: false,
    hourStart: 0,
    hourEnd: 24,
    eventView: true,
    taskView: true,
    hourDivision: 2,
    ...weekOptions,
  };

  return week;
}

export function createOptionsSlice(options: Options = {}): OptionsSlice {
  return {
    options: {
      defaultView: options.defaultView ?? 'week',
      isReadOnly: options.isReadOnly ?? false,
      week: initializeWeekOptions(options.week),
    },
  };
}
