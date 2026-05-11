import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { setRenderInfoOfUIModels } from './column.controller';
import { compareSchedulerEventsByOrder } from './scheduler-layout';

describe('column.controller', () => {
  it('应该允许 scheduler 用 order 控制同槽位事件的横向顺序', () => {
    const second = new EventUIModel(
      new EventModel({
        id: 'second',
        order: 2,
        start: new DayjsTZDate('2026-05-07T09:00:00'),
        end: new DayjsTZDate('2026-05-07T11:00:00'),
      })
    );
    const first = new EventUIModel(
      new EventModel({
        id: 'first',
        order: 1,
        start: new DayjsTZDate('2026-05-07T09:00:00'),
        end: new DayjsTZDate('2026-05-07T11:00:00'),
      })
    );

    const result = setRenderInfoOfUIModels(
      [second, first],
      new DayjsTZDate('2026-05-07T08:00:00'),
      new DayjsTZDate('2026-05-07T20:00:00'),
      compareSchedulerEventsByOrder
    );

    expect(result.map((uiModel) => uiModel.model.id)).toEqual(['first', 'second']);
    expect(first.left).toBe(0);
    expect(second.left).toBe(50);
  });
});
