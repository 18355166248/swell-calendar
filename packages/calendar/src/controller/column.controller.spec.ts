import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { setRenderInfoOfUIModels } from './column.controller';
import { compareSchedulerEventsByOrder } from './scheduler-layout';

describe('column.controller', () => {
  it('同起点长短事件输入乱序时也必须分到不同水平列，避免短卡覆盖长卡', () => {
    const long = new EventUIModel(
      new EventModel({
        id: 'long',
        start: new DayjsTZDate('2026-06-22T08:30:00'),
        end: new DayjsTZDate('2026-06-22T10:00:00'),
      })
    );
    const anotherLong = new EventUIModel(
      new EventModel({
        id: 'another-long',
        start: new DayjsTZDate('2026-06-22T08:30:00'),
        end: new DayjsTZDate('2026-06-22T12:00:00'),
      })
    );
    const short = new EventUIModel(
      new EventModel({
        id: 'short',
        start: new DayjsTZDate('2026-06-22T08:30:00'),
        end: new DayjsTZDate('2026-06-22T09:00:00'),
      })
    );

    const result = setRenderInfoOfUIModels(
      [short, long, anotherLong],
      new DayjsTZDate('2026-06-22T08:00:00'),
      new DayjsTZDate('2026-06-22T20:00:00')
    );

    expect(result.map((uiModel) => uiModel.model.id)).toEqual(['another-long', 'long', 'short']);
    expect(new Set(result.map((uiModel) => uiModel.left)).size).toBe(3);
    expect(result.every((uiModel) => uiModel.width === 33)).toBe(true);
  });

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
