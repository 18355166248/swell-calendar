import { Day } from '@/time/dateTime';
import { Options } from '@/types/options.type';
import { CalendarWeekOptions } from '@/types/store';

function initializeWeekOptions(weekOptions: Options['week'] = {}): CalendarWeekOptions {
  const week: CalendarWeekOptions = {
    startDayOfWeek: Day.SUN,
    dayNames: [],
    narrowWeekend: false,
    hourStart: 0,
    hourEnd: 24,
    eventView: true,
    taskView: true,
    ...weekOptions,
  };

  return week;
}

export function createOptionsSlice(options: Options = {}) {
  return {
    options: {
      defaultView: options.defaultView ?? 'week',
      week: initializeWeekOptions(options.week),
    },
  };
}
