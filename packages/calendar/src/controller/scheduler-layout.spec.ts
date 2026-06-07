import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { TimeGridData } from '@/types/grid.type';
import { Options } from '@/types/options.type';
import Collection from '@/utils/collection';

import {
  flattenSchedulerTimeEventMatrix,
  getColoredLayoutsForColumn,
  getSchedulerViewEvents,
  sortSchedulerEventsByOrder,
  splitMultiDayTimeEvents,
} from './scheduler-layout';

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

  it('全天事件时区无关：displayTimezone 下不平移边界，而定时事件平移', () => {
    const alldayEvent = new EventModel({
      id: 'e-allday-tz',
      title: 'allday-floating',
      start: new DayjsTZDate('2026-05-07T00:00:00'),
      end: new DayjsTZDate('2026-05-07T23:59:59'),
      allDay: true,
    });
    const timedEvent = new EventModel({
      id: 'e-timed-tz',
      // 选小偏移时区（LA 比 NY 慢 3h），转换后仍落在同一天视口内，便于断言钟点平移
      title: 'timed-shift',
      start: new DayjsTZDate('2026-05-07T12:00:00'),
      end: new DayjsTZDate('2026-05-07T13:00:00'),
      timezone: 'America/Los_Angeles',
    });
    const events = new Collection<EventModel>((model) => model.cid())
      .add(alldayEvent)
      .add(timedEvent);
    const calendar: CalendarData = {
      calendars: [],
      events,
      idsOfDay: {
        '20260507': [alldayEvent.cid(), timedEvent.cid()],
      },
    };

    const result = getSchedulerViewEvents(calendar, {
      start: new DayjsTZDate('2026-05-07T00:00:00'),
      end: new DayjsTZDate('2026-05-09T23:59:59'),
      hourStart: 0,
      hourEnd: 24,
      displayTimezone: 'America/New_York',
    });

    // 全天事件：日历日期保持 5/7，边界不随时区平移
    expect(result.allday).toHaveLength(1);
    const allday = result.allday[0];
    expect(allday.model.getStarts().getFullYear()).toBe(2026);
    expect(allday.model.getStarts().getMonth()).toBe(4); // 0-based → 5 月
    expect(allday.model.getStarts().getDate()).toBe(7);

    // 定时事件：LA 12:00 在纽约视角应被平移到更晚的钟点（确有转换发生）
    const timed = result.time.find((m) => m.model.id === 'e-timed-tz');
    expect(timed).toBeDefined();
    expect(timed!.model.getStarts().getHours()).not.toBe(12);
  });

  it('应该按 EventObject.order 对 scheduler 同槽位事件稳定排序', () => {
    const first = new EventUIModel(
      new EventModel({
        id: 'order-first',
        title: 'first',
        order: 1,
        start: new DayjsTZDate('2026-05-07T09:00:00'),
        end: new DayjsTZDate('2026-05-07T10:00:00'),
        resourceId: 'room-a',
      })
    );
    const second = new EventUIModel(
      new EventModel({
        id: 'order-second',
        title: 'second',
        order: 2,
        start: new DayjsTZDate('2026-05-07T09:00:00'),
        end: new DayjsTZDate('2026-05-07T10:00:00'),
        resourceId: 'room-a',
      })
    );
    const defaultOrder = new EventUIModel(
      new EventModel({
        id: 'order-default',
        title: 'default',
        start: new DayjsTZDate('2026-05-07T09:00:00'),
        end: new DayjsTZDate('2026-05-07T10:00:00'),
        resourceId: 'room-a',
      })
    );

    const result = sortSchedulerEventsByOrder([second, first, defaultOrder]);

    expect(result.map((uiModel) => uiModel.model.id)).toEqual([
      'order-default',
      'order-first',
      'order-second',
    ]);
  });
});

describe('splitMultiDayTimeEvents', () => {
  const viewStart = new DayjsTZDate('2026-05-07T00:00:00');
  const viewEnd = new DayjsTZDate('2026-05-09T23:59:59');

  it('单日事件应原样返回（同一引用）', () => {
    const model = new EventModel({
      title: 'single',
      start: new DayjsTZDate('2026-05-07T09:00:00'),
      end: new DayjsTZDate('2026-05-07T10:00:00'),
    });
    const uiModel = new EventUIModel(model);
    const result = splitMultiDayTimeEvents([uiModel], viewStart, viewEnd);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(uiModel);
  });

  it('跨 2 天的事件应分裂为 2 段', () => {
    const model = new EventModel({
      id: 'multi-2',
      title: '跨天会议',
      start: new DayjsTZDate('2026-05-07T10:00:00'),
      end: new DayjsTZDate('2026-05-08T14:00:00'),
    });
    const uiModel = new EventUIModel(model);
    const result = splitMultiDayTimeEvents([uiModel], viewStart, viewEnd);

    expect(result).toHaveLength(2);

    // 第一段：5月7日 10:00 → 23:59:59，croppedEnd
    expect(result[0].model.getStarts().getDate()).toBe(7);
    expect(result[0].model.getEnds().getDate()).toBe(7);
    expect(result[0].croppedStart).toBe(false);
    expect(result[0].croppedEnd).toBe(true);

    // 第二段：5月8日 00:00:00 → 14:00，croppedStart
    expect(result[1].model.getStarts().getDate()).toBe(8);
    expect(result[1].model.getEnds().getDate()).toBe(8);
    expect(result[1].croppedStart).toBe(true);
    expect(result[1].croppedEnd).toBe(false);
  });

  it('跨 3 天的事件应分裂为 3 段', () => {
    const model = new EventModel({
      id: 'multi-3',
      title: '三天活动',
      start: new DayjsTZDate('2026-05-07T09:00:00'),
      end: new DayjsTZDate('2026-05-09T17:00:00'),
    });
    const uiModel = new EventUIModel(model);
    const result = splitMultiDayTimeEvents([uiModel], viewStart, viewEnd);

    expect(result).toHaveLength(3);

    // 第一段
    expect(result[0].croppedStart).toBe(false);
    expect(result[0].croppedEnd).toBe(true);

    // 中间段（两侧均裁剪）
    expect(result[1].croppedStart).toBe(true);
    expect(result[1].croppedEnd).toBe(true);

    // 最后一段
    expect(result[2].croppedStart).toBe(true);
    expect(result[2].croppedEnd).toBe(false);
  });

  it('分段后各段 hasMultiDates 应为 false', () => {
    const model = new EventModel({
      start: new DayjsTZDate('2026-05-07T10:00:00'),
      end: new DayjsTZDate('2026-05-08T14:00:00'),
    });
    const uiModel = new EventUIModel(model);
    const result = splitMultiDayTimeEvents([uiModel], viewStart, viewEnd);

    result.forEach((seg) => {
      expect(seg.model.hasMultiDates).toBe(false);
    });
  });

  it('分段保留原始事件 id 和 resourceId', () => {
    const model = new EventModel({
      id: 'room-event-1',
      title: '资源跨天事件',
      resourceId: 'r2',
      start: new DayjsTZDate('2026-05-07T22:00:00'),
      end: new DayjsTZDate('2026-05-08T23:30:00'),
    });
    const uiModel = new EventUIModel(model);
    const result = splitMultiDayTimeEvents([uiModel], viewStart, viewEnd);

    expect(result).toHaveLength(2);
    result.forEach((seg) => {
      expect(seg.model.id).toBe('room-event-1');
      expect(seg.model.resourceId).toBe('r2');
    });
  });

  it('事件范围在视图之外应不生成分段', () => {
    const model = new EventModel({
      start: new DayjsTZDate('2026-05-10T10:00:00'),
      end: new DayjsTZDate('2026-05-12T10:00:00'),
    });
    const uiModel = new EventUIModel(model);
    const result = splitMultiDayTimeEvents([uiModel], viewStart, viewEnd);

    expect(result).toHaveLength(0);
  });
});

describe('getColoredLayoutsForColumn', () => {
  const timeGridData: TimeGridData = {
    rows: [
      { top: 0, height: 25, startTime: '09:00', endTime: '10:00' },
      { top: 25, height: 25, startTime: '10:00', endTime: '11:00' },
      { top: 50, height: 25, startTime: '11:00', endTime: '12:00' },
      { top: 75, height: 25, startTime: '12:00', endTime: '13:00' },
    ],
    columns: [
      {
        date: new DayjsTZDate('2026-05-07T00:00:00'),
        left: 0,
        width: 100,
        resourceId: 'room-a',
        resourceName: '会议室 A',
      },
    ],
  };

  it('应该为命中资源的 colored 区段生成 layout 与样式', () => {
    const options: Options = {
      scheduler: {
        colors: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T12:00:00'),
            resourceId: 'room-a',
            background: 'rgba(34, 197, 94, 0.18)',
            cssClass: 'available',
          },
        ],
      },
    };

    const layouts = getColoredLayoutsForColumn(
      options,
      'scheduler',
      timeGridData,
      timeGridData.columns[0]
    );

    expect(layouts).toHaveLength(1);
    expect(layouts[0]).toMatchObject({
      top: 25,
      height: 50,
      background: 'rgba(34, 197, 94, 0.18)',
      cssClass: 'available',
    });
  });

  it('未匹配资源时返回空', () => {
    const options: Options = {
      scheduler: {
        colors: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T12:00:00'),
            resourceId: 'room-b',
          },
        ],
      },
    };

    const layouts = getColoredLayoutsForColumn(
      options,
      'scheduler',
      timeGridData,
      timeGridData.columns[0]
    );

    expect(layouts).toHaveLength(0);
  });

  it('未指定资源时所有列都匹配', () => {
    const options: Options = {
      scheduler: {
        colors: [
          {
            start: new DayjsTZDate('2026-05-07T10:30:00'),
            end: new DayjsTZDate('2026-05-07T11:30:00'),
          },
        ],
      },
    };

    const layouts = getColoredLayoutsForColumn(
      options,
      'scheduler',
      timeGridData,
      timeGridData.columns[0]
    );

    expect(layouts).toHaveLength(1);
    expect(layouts[0].top).toBeCloseTo(37.5);
    expect(layouts[0].height).toBeCloseTo(25);
  });

  it('非 scheduler / timeline 视图返回空', () => {
    const options: Options = {
      scheduler: {
        colors: [
          {
            start: new DayjsTZDate('2026-05-07T10:00:00'),
            end: new DayjsTZDate('2026-05-07T11:00:00'),
          },
        ],
      },
    };

    const layouts = getColoredLayoutsForColumn(
      options,
      'week',
      timeGridData,
      timeGridData.columns[0]
    );

    expect(layouts).toHaveLength(0);
  });
});
