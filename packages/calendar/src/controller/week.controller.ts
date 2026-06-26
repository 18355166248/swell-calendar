import { isNil } from 'lodash-es';

import { expandAllRecurringInRange } from '@/controller/scheduler-recurrence';
import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { DayGridEventMatrix, EventGroupMap, Matrix3d } from '@/types/events.type';
import { WeekOptions } from '@/types/options.type';
import { Panel } from '@/types/panel.type';
import array from '@/utils/array';
import Collection from '@/utils/collection';

import {
  convertToUIModel,
  generate3DMatrix,
  getCollisionGroup,
  getEventInDateRangeFilter,
} from './core.controller';
import { filterByCategory, getDateRange } from './event.controller';

function getUIModelForAlldayView(
  start: DayjsTZDate,
  end: DayjsTZDate,
  uiModelColl: Collection<EventUIModel>
): DayGridEventMatrix {
  const totalDays = Math.max(1, end.dayjs.diff(start.dayjs, 'day') + 1);
  const uiModels = uiModelColl.sort(array.compare.event.asc);

  uiModels.forEach((uiModel) => {
    const eventStart = uiModel.getStarts();
    const eventEnd = uiModel.getEnds();

    const exceedLeft = eventStart.getTime() < start.getTime();
    const exceedRight = eventEnd.getTime() > end.getTime();

    const clampedStart = exceedLeft ? start : eventStart;
    const clampedEnd = exceedRight ? end : eventEnd;

    const leftDays = Math.max(0, clampedStart.dayjs.diff(start.dayjs, 'day'));
    const spanDays = Math.max(1, clampedEnd.dayjs.diff(clampedStart.dayjs, 'day') + 1);

    uiModel.left = (leftDays / totalDays) * 100;
    uiModel.width = Math.min((spanDays / totalDays) * 100, 100 - uiModel.left);
    uiModel.exceedLeft = exceedLeft;
    uiModel.exceedRight = exceedRight;
  });

  const slotEndTimes: number[] = [];
  const matrixBySlot: EventUIModel[][] = [];

  uiModels.forEach((uiModel) => {
    const eventStart = uiModel.getStarts().getTime();
    const eventEnd = uiModel.getEnds().getTime();

    let slot = slotEndTimes.findIndex((endTime) => endTime <= eventStart);

    if (slot === -1) {
      slot = slotEndTimes.length;
      slotEndTimes.push(0);
      matrixBySlot.push([]);
    }

    slotEndTimes[slot] = eventEnd;
    matrixBySlot[slot].push(uiModel);
  });

  return matrixBySlot.length > 0 ? [matrixBySlot] : [];
}

export function splitEventByDateRange(
  idsOfDay: Record<string, number[]>,
  start: DayjsTZDate,
  end: DayjsTZDate,
  uiModelTimeColl: Collection<EventUIModel> | Collection<EventModel>
) {
  const result: Record<string, Collection<EventModel | EventUIModel>> = {};

  const range = getDateRange(start, end);

  range.forEach((date) => {
    const dateStr = date.dayjs.format('YYYYMMDD');
    const ids = idsOfDay[dateStr];

    const collection = (result[dateStr] = new Collection<EventModel | EventUIModel>((event) =>
      event.cid()
    ));

    if (ids && ids.length > 0) {
      ids.forEach((id) => {
        uiModelTimeColl.doWhenHas(id, (event) => {
          collection.add(event);
        });
      });
    }
  });

  return result;
}

export function _makeGetUIModelFuncForTimeView(
  hourStart: number,
  hourEnd: number
): (uiModelColl: Collection<EventUIModel>) => EventUIModel[] {
  if (hourStart === 0 && hourEnd === 24) {
    return (uiModelColl: Collection<EventUIModel>) => {
      return uiModelColl.sort(array.compare.event.asc);
    };
  }

  return (uiModelColl: Collection<EventUIModel>) => {
    return uiModelColl.toArray();
  };
}

function getUIModelForTimeView(
  idsOfDay: Record<string, number[]>,
  condition: {
    start: DayjsTZDate;
    end: DayjsTZDate;
    uiModelTimeColl: Collection<EventUIModel>;
    hourStart: number;
    hourEnd: number;
  }
) {
  const { start, end, uiModelTimeColl, hourStart, hourEnd } = condition;

  const ymdSplitted = splitEventByDateRange(idsOfDay, start, end, uiModelTimeColl);

  const result: Record<string, Matrix3d<EventUIModel>> = {};

  const _getUIModel = _makeGetUIModelFuncForTimeView(hourStart, hourEnd);

  const usingTravelTime = true;

  Object.entries(ymdSplitted).forEach(([dateStr, uiModelColl]) => {
    const uiModels = _getUIModel(uiModelColl as Collection<EventUIModel>);

    const collisionGroups = getCollisionGroup(uiModels, usingTravelTime);

    const matrix = generate3DMatrix(uiModelColl, collisionGroups, usingTravelTime);

    result[dateStr] = matrix as Matrix3d<EventUIModel>;
  });

  return result;
}

export function findByDateRange(
  calendar: CalendarData,
  params: {
    start: DayjsTZDate;
    end: DayjsTZDate;
    panels: Panel[];
    options: WeekOptions;
  }
) {
  const { start, end, panels, options } = params;

  const { events, idsOfDay } = calendar;
  const hourStart = options.hourStart || 0;
  const hourEnd = options.hourEnd || 24;

  const filterFn = Collection.and(getEventInDateRangeFilter(start, end));

  const { nonRecurring, instances } = expandAllRecurringInRange(events, start, end);

  // 非重复事件额外按视口日期过滤（recurring 展开时已经限定在 start~end 内）
  const combinedCollection = new Collection<EventModel>((m) => m.cid());
  for (const m of nonRecurring) {
    if (filterFn(m)) combinedCollection.add(m);
  }
  for (const m of instances) {
    combinedCollection.add(m);
  }

  const uiModelColl = convertToUIModel(combinedCollection);

  const group: Record<string, Collection<EventUIModel>> = uiModelColl.groupBy(filterByCategory);

  return panels.reduce<EventGroupMap>(
    (acc, cur) => {
      const { name, type } = cur;

      if (isNil(group[name])) {
        return acc;
      }

      return {
        ...acc,
        [name]:
          type === 'daygrid'
            ? getUIModelForAlldayView(start, end, group[name])
            : getUIModelForTimeView(idsOfDay, {
                start,
                end,
                uiModelTimeColl: group[name],
                hourStart,
                hourEnd,
              }),
      };
    },
    {
      milestone: [],
      task: [],
      allday: [],
      time: {},
    }
  );
}
