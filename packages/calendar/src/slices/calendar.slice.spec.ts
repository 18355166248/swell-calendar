import { describe, expect, it } from 'vitest';

import { createCalendarStore } from '@/contexts/calendarStore';
import { EventObject } from '@/types/events.type';

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
];

function cidById(store: ReturnType<typeof createCalendarStore>) {
  const map: Record<string, number> = {};
  store
    .getState()
    .calendar.events.toArray()
    .forEach((model) => {
      map[model.id] = model.cid();
    });
  return map;
}

describe('calendar.slice updateEvent (immer produce path)', () => {
  it('preserves all cids and updates the target in place', () => {
    const store = createCalendarStore();
    store.getState().calendar.setEvents(seed);
    const before = cidById(store);
    const prevCollection = store.getState().calendar.events;

    store.getState().calendar.updateEvent({
      ...seed[0],
      start: new Date('2026-06-08T09:30:00'),
      end: new Date('2026-06-08T11:30:00'),
    });

    // cid 全部保持（含被更新的 a）
    expect(cidById(store)).toEqual(before);
    // 集合引用变化（触发重渲染）
    expect(store.getState().calendar.events).not.toBe(prevCollection);
    // 目标事件字段已更新
    const updated = store.getState().calendar.events.find((m) => m.id === 'a');
    expect(updated!.getEnds().getHours()).toBe(11);
    expect(updated!.getEnds().getMinutes()).toBe(30);
  });

  it('keeps the moved event findable by id with the same cid (move-then-resize safety)', () => {
    const store = createCalendarStore();
    store.getState().calendar.setEvents(seed);
    const cidBefore = store
      .getState()
      .calendar.events.find((m) => m.id === 'a')!
      .cid();

    // 模拟"移动"
    store.getState().calendar.updateEvent({
      ...seed[0],
      start: new Date('2026-06-08T10:00:00'),
      end: new Date('2026-06-08T11:00:00'),
    });

    // 移动后立即"resize"：必须仍能用同一 cid 找回（这是 resize 不失灵的前提）
    const afterMove = store.getState().calendar.events.find((m) => m.id === 'a');
    expect(afterMove!.cid()).toBe(cidBefore);

    store.getState().calendar.updateEvent({
      ...seed[0],
      start: new Date('2026-06-08T10:00:00'),
      end: new Date('2026-06-08T12:00:00'),
    });
    const afterResize = store.getState().calendar.events.find((m) => m.id === 'a');
    expect(afterResize!.cid()).toBe(cidBefore);
    expect(afterResize!.getEnds().getHours()).toBe(12);
  });
});
