import { describe, expect, it } from 'vitest';

import { EventModel } from './eventModel';

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
