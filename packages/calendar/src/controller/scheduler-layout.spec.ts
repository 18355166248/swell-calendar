import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import Collection from '@/utils/collection';

import {
  flattenSchedulerTimeEventMatrix,
  getSchedulerViewEvents,
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
