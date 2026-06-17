import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObject } from '@/types/events.type';

import {
  computeMovedMonthEvent,
  computeResizedMonthEvent,
  getMonthGridPositionFromPoint,
} from './month-interaction';

describe('month-interaction', () => {
  describe('getMonthGridPositionFromPoint', () => {
    // 6 周 × 7 列，网格 700×600（每格 100×100）
    const base = { width: 700, height: 600, weekCount: 6, colCount: 7 };

    it('左上角第一格 → week 0 / col 0 / flatOffset 0', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 10, offsetY: 10 });
      expect(pos).toEqual({ weekIndex: 0, colIndex: 0, flatOffset: 0 });
    });

    it('第 2 周第 3 列 → flatOffset = 1*7 + 2 = 9', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 250, offsetY: 150 });
      expect(pos).toEqual({ weekIndex: 1, colIndex: 2, flatOffset: 9 });
    });

    it('越界坐标 clamp 到合法范围', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: 9999, offsetY: 9999 });
      expect(pos).toEqual({ weekIndex: 5, colIndex: 6, flatOffset: 41 });
    });

    it('负坐标 clamp 到 0', () => {
      const pos = getMonthGridPositionFromPoint({ ...base, offsetX: -50, offsetY: -50 });
      expect(pos).toEqual({ weekIndex: 0, colIndex: 0, flatOffset: 0 });
    });
  });

  describe('computeMovedMonthEvent', () => {
    const prev: EventObject = {
      id: '1',
      calendarId: 'c1',
      title: 'e',
      start: new DayjsTZDate('2026-06-10T09:00:00'),
      end: new DayjsTZDate('2026-06-12T10:00:00'),
    } as EventObject;

    it('正向平移 +3 天，保留时分与跨天天数', () => {
      const next = computeMovedMonthEvent(prev, 3);
      expect((next.start as DayjsTZDate).dayjs.date()).toBe(13);
      expect((next.end as DayjsTZDate).dayjs.date()).toBe(15);
      expect((next.start as DayjsTZDate).dayjs.hour()).toBe(9);
      expect((next.end as DayjsTZDate).dayjs.hour()).toBe(10);
    });

    it('负向平移 -5 天', () => {
      const next = computeMovedMonthEvent(prev, -5);
      expect((next.start as DayjsTZDate).dayjs.date()).toBe(5);
      expect((next.end as DayjsTZDate).dayjs.date()).toBe(7);
    });

    it('不修改原对象', () => {
      computeMovedMonthEvent(prev, 3);
      expect((prev.start as DayjsTZDate).dayjs.date()).toBe(10);
    });
  });

  describe('computeResizedMonthEvent', () => {
    const prev: EventObject = {
      id: '2',
      calendarId: 'c1',
      title: 'resize',
      start: new DayjsTZDate('2026-06-10T09:00:00'),
      end: new DayjsTZDate('2026-06-12T10:00:00'),
    } as EventObject;

    it('start 边左拖 -2 天，只改开始日期', () => {
      const next = computeResizedMonthEvent(prev, 'start', -2);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-08 09:00');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-12 10:00');
    });

    it('end 边右拖 +3 天，只改结束日期', () => {
      const next = computeResizedMonthEvent(prev, 'end', 3);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-10 09:00');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-15 10:00');
    });

    it('start 拖过 end 时夹紧到 end 当天', () => {
      const next = computeResizedMonthEvent(prev, 'start', 5);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-12 10:00');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-12 10:00');
    });

    it('end 拖到 start 之前时夹紧到 start 当天', () => {
      const next = computeResizedMonthEvent(prev, 'end', -5);
      expect((next.start as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-10 09:00');
      expect((next.end as DayjsTZDate).dayjs.format('YYYY-MM-DD HH:mm')).toBe('2026-06-10 09:00');
    });
  });
});
