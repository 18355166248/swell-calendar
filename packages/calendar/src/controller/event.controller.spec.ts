import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import { CalendarData } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';

import {
  applyOptimisticEventUpdate,
  createEventCollection,
  createEvents,
  filterByCategory,
  isAllday,
} from './event.controller';

function makeCalendarData(events: EventObject[]): CalendarData {
  const calendarData: CalendarData = {
    calendars: [],
    events: createEventCollection<EventModel>(),
    idsOfDay: {},
  };
  createEvents(calendarData, events);
  return calendarData;
}

const seed: EventObject[] = [
  {
    id: 'a',
    title: 'A',
    category: 'time',
    start: new Date('2026-06-08T09:00:00'),
    end: new Date('2026-06-08T10:00:00'),
    resourceId: 'r1',
  },
  {
    id: 'b',
    title: 'B',
    category: 'time',
    start: new Date('2026-06-08T11:00:00'),
    end: new Date('2026-06-08T12:00:00'),
    resourceId: 'r2',
  },
  {
    id: 'c',
    title: 'C',
    category: 'time',
    start: new Date('2026-06-08T13:00:00'),
    end: new Date('2026-06-08T14:00:00'),
    resourceId: 'r3',
  },
];

function cidById(calendarData: CalendarData) {
  const map: Record<string, number> = {};
  calendarData.events.toArray().forEach((model) => {
    map[model.id] = model.cid();
  });
  return map;
}

describe('isAllday / filterByCategory · 跨天定时事件不再塌进全天条', () => {
  const model = (event: ConstructorParameters<typeof EventModel>[0]) => new EventModel(event);

  it('跨天（>24h）time 事件 isAllday 为 false（核心回归）', () => {
    expect(
      isAllday(
        model({
          category: 'time',
          start: new Date('2025-03-18T08:00:00'),
          end: new Date('2025-03-20T10:00:00'), // 约 50h
        })
      )
    ).toBe(false);
  });

  it('显式 allDay / isAllday 仍为 true', () => {
    expect(
      isAllday(
        model({ category: 'allday', start: new Date('2025-03-18'), end: new Date('2025-03-18') })
      )
    ).toBe(true);
    expect(
      isAllday(
        model({
          category: 'time',
          isAllday: true,
          start: new Date('2025-03-18T08:00:00'),
          end: new Date('2025-03-18T09:00:00'),
        })
      )
    ).toBe(true);
  });

  it('跨天 time 事件被 filterByCategory 归到 time 面板（而非 allday）', () => {
    const uiModel = new EventUIModel(
      model({
        category: 'time',
        start: new Date('2025-03-18T08:00:00'),
        end: new Date('2025-03-20T10:00:00'),
      })
    );
    expect(filterByCategory(uiModel)).toBe('time');
  });
});

describe('applyOptimisticEventUpdate', () => {
  it('preserves the cid of EVERY event, including the updated one (race-free optimistic update)', () => {
    const calendarData = makeCalendarData(seed);
    const before = cidById(calendarData);

    applyOptimisticEventUpdate(calendarData, {
      ...seed[0],
      start: new Date('2026-06-08T09:30:00'),
      end: new Date('2026-06-08T11:30:00'),
    });

    const after = cidById(calendarData);

    // 关键不变量：所有事件（含被更新的 a）cid 不变 —— 这是"移动后立刻 resize"不再失灵的根本保证
    expect(after).toEqual(before);
  });

  it('updates the target event start/end in place', () => {
    const calendarData = makeCalendarData(seed);

    applyOptimisticEventUpdate(calendarData, {
      ...seed[0],
      start: new Date('2026-06-08T09:30:00'),
      end: new Date('2026-06-08T11:30:00'),
    });

    const updated = calendarData.events.find((m) => m.id === 'a');
    expect(updated).not.toBeNull();
    expect(updated!.getStarts().getHours()).toBe(9);
    expect(updated!.getStarts().getMinutes()).toBe(30);
    expect(updated!.getEnds().getHours()).toBe(11);
    expect(updated!.getEnds().getMinutes()).toBe(30);
  });

  it('returns a fresh events collection reference so React re-renders', () => {
    const calendarData = makeCalendarData(seed);
    const prevCollection = calendarData.events;

    applyOptimisticEventUpdate(calendarData, {
      ...seed[1],
      start: new Date('2026-06-08T11:30:00'),
      end: new Date('2026-06-08T12:30:00'),
    });

    expect(calendarData.events).not.toBe(prevCollection);
    expect(calendarData.events.size).toBe(3);
  });

  it('rebuilds the day matrix for the moved date', () => {
    const calendarData = makeCalendarData(seed);

    applyOptimisticEventUpdate(calendarData, {
      ...seed[0],
      start: new Date('2026-06-09T09:00:00'),
      end: new Date('2026-06-09T10:00:00'),
    });

    const movedCid = calendarData.events.find((m) => m.id === 'a')!.cid();
    expect(calendarData.idsOfDay['20260609']).toContain(movedCid);
    expect(calendarData.idsOfDay['20260608'] ?? []).not.toContain(movedCid);
  });

  it('is a no-op when the id does not exist', () => {
    const calendarData = makeCalendarData(seed);
    const before = cidById(calendarData);

    applyOptimisticEventUpdate(calendarData, {
      id: 'does-not-exist',
      title: 'X',
      category: 'time',
      start: new Date('2026-06-08T09:00:00'),
      end: new Date('2026-06-08T10:00:00'),
    });

    expect(cidById(calendarData)).toEqual(before);
    expect(calendarData.events.size).toBe(3);
  });
});
