import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import Collection from '@/utils/collection';

import { flattenSchedulerTimeEventMatrix, getSchedulerViewEvents } from './scheduler-layout';

describe('scheduler-layout', () => {
  it('应该对跨日期矩阵中的同一个 UI 模型去重', () => {
    const shared = new EventUIModel(
      new EventModel({
        title: 'shared',
        start: new DayjsTZDate('2026-05-07T09:00:00'),
        end: new DayjsTZDate('2026-05-07T10:00:00'),
      })
    );
    const another = new EventUIModel(
      new EventModel({
        title: 'another',
        start: new DayjsTZDate('2026-05-08T11:00:00'),
        end: new DayjsTZDate('2026-05-08T12:00:00'),
      })
    );

    const result = flattenSchedulerTimeEventMatrix({
      '20260507': [[[shared]], [[another]]],
      '20260508': [[[shared]]],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(shared);
    expect(result[1]).toBe(another);
  });

  it('应该通过独立 scheduler pipeline 返回时间事件', () => {
    const event = new EventModel({
      id: 'e-1',
      title: 'scheduler-event',
      start: new DayjsTZDate('2026-05-07T09:00:00'),
      end: new DayjsTZDate('2026-05-07T10:00:00'),
      resourceId: 'room-a',
    });
    const events = new Collection<EventModel>((model) => model.cid()).add(event);
    const calendar: CalendarData = {
      calendars: [],
      events,
      idsOfDay: {
        '20260507': [event.cid()],
      },
    };

    const result = getSchedulerViewEvents(calendar, {
      start: new DayjsTZDate('2026-05-07T00:00:00'),
      end: new DayjsTZDate('2026-05-09T23:59:59'),
      hourStart: 0,
      hourEnd: 24,
    });

    expect(result.time).toHaveLength(1);
    expect(result.time[0].model.id).toBe('e-1');
    expect(result.time[0].model.title).toBe('scheduler-event');
  });

  it('应该通过独立 scheduler pipeline 返回全天事件', () => {
    const event = new EventModel({
      id: 'e-all-day-1',
      title: 'scheduler-allday-event',
      start: new DayjsTZDate('2026-05-07T00:00:00'),
      end: new DayjsTZDate('2026-05-07T23:59:59'),
      allDay: true,
    });
    const events = new Collection<EventModel>((model) => model.cid()).add(event);
    const calendar: CalendarData = {
      calendars: [],
      events,
      idsOfDay: {
        '20260507': [event.cid()],
      },
    };

    const result = getSchedulerViewEvents(calendar, {
      start: new DayjsTZDate('2026-05-07T00:00:00'),
      end: new DayjsTZDate('2026-05-09T23:59:59'),
      hourStart: 0,
      hourEnd: 24,
    });

    expect(result.allday).toHaveLength(1);
    expect(result.allday[0].model.id).toBe('e-all-day-1');
    expect(result.allday[0].model.title).toBe('scheduler-allday-event');
  });
});
