import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import { toEndOfDay, toStartOfDay } from '@/time/datetime';
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

export function splitMultiDayTimeEvents(
  events: EventUIModel[],
  viewStart: DayjsTZDate,
  viewEnd: DayjsTZDate
): EventUIModel[] {
  const result: EventUIModel[] = [];

  for (const uiModel of events) {
    const { model } = uiModel;

    if (!model.hasMultiDates) {
      result.push(uiModel);
      continue;
    }

    const eventStart = model.getStarts();
    const eventEnd = model.getEnds();

    let currentDay = toStartOfDay(eventStart > viewStart ? eventStart : viewStart);

    while (currentDay <= viewEnd && currentDay <= eventEnd) {
      const dayStart = toStartOfDay(currentDay);
      const dayEnd = toEndOfDay(currentDay);

      const segStart = eventStart > dayStart ? eventStart : dayStart;
      const segEnd = eventEnd < dayEnd ? eventEnd : dayEnd;

      const segmentModel = new EventModel({
        ...model.toEventObject(),
        start: segStart,
        end: segEnd,
      });

      const segmentUIModel = new EventUIModel(segmentModel);
      segmentUIModel.croppedStart = eventStart < dayStart;
      segmentUIModel.croppedEnd = eventEnd > dayEnd;

      result.push(segmentUIModel);

      currentDay = dayStart.addDate(1);
    }
  }

  return result;
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

  const timeEvents = flattenSchedulerTimeEventMatrix(eventGroups.time as TimeGridEventMatrix);

  return {
    allday: flattenSchedulerDayGridMatrix(eventGroups.allday as DayGridEventMatrix),
    time: splitMultiDayTimeEvents(timeEvents, start, end),
  };
}
