import { describe, expect, it } from 'vitest';

import { EventModel, isTimeEvent } from './eventModel';
import { EventUIModel } from './eventUIModel';

describe('isTimeEvent · 跨天定时事件仍算时间事件', () => {
  const ui = (event: ConstructorParameters<typeof EventModel>[0]) =>
    new EventUIModel(new EventModel(event));

  it('单日 time 事件为 true', () => {
    expect(
      isTimeEvent(
        ui({
          category: 'time',
          start: new Date('2025-03-18T09:00:00'),
          end: new Date('2025-03-18T10:00:00'),
        })
      )
    ).toBe(true);
  });

  it('跨天（>24h）time 事件仍为 true —— 交由时间网格按列分段，不再被排除', () => {
    expect(
      isTimeEvent(
        ui({
          category: 'time',
          start: new Date('2025-03-18T08:00:00'),
          end: new Date('2025-03-20T10:00:00'), // 约 50h
        })
      )
    ).toBe(true);
  });

  it('allday 事件为 false', () => {
    expect(
      isTimeEvent(
        ui({
          category: 'allday',
          start: new Date('2025-03-18T00:00:00'),
          end: new Date('2025-03-18T23:59:00'),
        })
      )
    ).toBe(false);
  });
});

describe('EventModel', () => {
  it('应保留 calendarId 与 raw 到回调事件对象', () => {
    const raw = {
      id: 'mock-1',
      loc: '海景厅',
      who: '产品 · 设计 · 工程',
    };
    const model = new EventModel({
      id: 'evt-1',
      calendarId: 'seafoam',
      title: '产品双周评审',
      start: new Date('2025-03-17T09:00:00'),
      end: new Date('2025-03-17T10:30:00'),
      raw,
    });

    const eventObject = model.toEventObject();

    expect(eventObject.calendarId).toBe('seafoam');
    expect(eventObject.raw).toEqual(raw);
  });
});
