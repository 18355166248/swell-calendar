import { Day } from '@/time/datetime';
import { Options, OptionsSlice } from '@/types/options.type';
import { CalendarWeekOptions } from '@/types/store.type';
import { produce } from 'immer';
import { CalendarStore } from '@/types/store.type';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

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

export function createOptionsSlice(options: Options = {}) {
  return (set: SetState): OptionsSlice => ({
    options: {
      defaultView: options.defaultView ?? 'week',
      isReadOnly: options.isReadOnly ?? false,
      week: initializeWeekOptions(options.week),
      calendars: options.calendars ?? [],
      setOptions: (options) => {
        set(
          produce((state: CalendarStore) => {
            state.options.week = initializeWeekOptions(options.week);
            state.options.calendars = options.calendars ?? [];
            state.options.defaultView = options.defaultView ?? 'week';
            state.options.isReadOnly = options.isReadOnly ?? false;
          })
        );
      },
    },
  });
}
