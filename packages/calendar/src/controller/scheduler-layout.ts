import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { DayGridEventMatrix, EventModelMap, TimeGridEventMatrix } from '@/types/events.type';
import { Panel } from '@/types/panel.type';

import { findByDateRange as findByDateRangeForWeek } from './week.controller';

function flattenSchedulerMatrix3d(eventMatrix: TimeGridEventMatrix[keyof TimeGridEventMatrix]) {
  return eventMatrix.flatMap((matrix) => matrix.flatMap((row) => row.filter(Boolean)));
}

function flattenSchedulerDayGridMatrix(eventMatrix: DayGridEventMatrix) {
  return eventMatrix.flatMap((matrix) => matrix.flatMap((row) => row.filter(Boolean)));
}

export function flattenSchedulerTimeEventMatrix(eventMatrix: TimeGridEventMatrix) {
  return Array.from(
    new Set(
      Object.values(eventMatrix).reduce<EventUIModel[]>(
        (result, matrix3d) => result.concat(flattenSchedulerMatrix3d(matrix3d)),
        []
      )
    )
  );
}

export function getSchedulerViewEvents(
  calendar: CalendarData,
  {
    start,
    end,
    hourStart,
    hourEnd,
  }: {
    start: DayjsTZDate;
    end: DayjsTZDate;
    hourStart: number;
    hourEnd: number;
  }
): Pick<EventModelMap, 'allday' | 'time'> {
  const panels: Panel[] = [
    {
      name: 'allday',
      type: 'daygrid',
      show: true,
    },
    {
      name: 'time',
      type: 'timegrid',
      show: true,
    },
  ];

  const eventGroups = findByDateRangeForWeek(calendar, {
    start,
    end,
    panels,
    options: {
      hourStart,
      hourEnd,
    },
  });

  return {
    allday: flattenSchedulerDayGridMatrix(eventGroups.allday as DayGridEventMatrix),
    time: flattenSchedulerTimeEventMatrix(eventGroups.time as TimeGridEventMatrix),
  };
}
