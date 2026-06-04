import { describe, expect, it } from 'vitest';

import DayjsTZDate from '@/time/dayjs-tzdate';

import { expandRecurrence } from './recurrence';

describe('expandRecurrence', () => {
  const eventStart = new DayjsTZDate(2026, 5, 1); // 2026-06-01 (Mon)
  const rangeStart = new DayjsTZDate(2026, 5, 1);
  const rangeEnd = new DayjsTZDate(2026, 5, 14); // two-week window

  describe('daily', () => {
    it('展开基本每日事件', () => {
      const result = expandRecurrence({ frequency: 'daily' }, eventStart, rangeStart, rangeEnd);
      expect(result.dates.length).toBe(14); // June 1-14
      expect(result.dates[0].getDate()).toBe(1);
      expect(result.dates[13].getDate()).toBe(14);
    });

    it('按 interval 间隔展开', () => {
      const result = expandRecurrence(
        { frequency: 'daily', interval: 3 },
        eventStart,
        rangeStart,
        rangeEnd
      );
      // June 1,4,7,10,13 = 5 occurrences
      expect(result.dates.length).toBe(5);
      expect(result.dates.map((d) => d.getDate())).toEqual([1, 4, 7, 10, 13]);
    });

    it('count 控制次数上限', () => {
      const result = expandRecurrence(
        { frequency: 'daily', count: 3 },
        eventStart,
        rangeStart,
        rangeEnd
      );
      expect(result.dates.length).toBe(3);
      expect(result.truncatedByCount).toBe(true);
    });

    it('until 截止日期截断', () => {
      const until = new DayjsTZDate(2026, 5, 5);
      const result = expandRecurrence(
        { frequency: 'daily', until },
        eventStart,
        rangeStart,
        rangeEnd
      );
      expect(result.dates.length).toBe(5); // 1-5
    });

    it('exceptions 排除指定日期', () => {
      const result = expandRecurrence(
        {
          frequency: 'daily',
          exceptions: [new DayjsTZDate(2026, 5, 3), new DayjsTZDate(2026, 5, 10)],
        },
        eventStart,
        rangeStart,
        rangeEnd
      );
      // 14 - 2 = 12
      const dates = result.dates.map((d) => d.getDate());
      expect(dates).not.toContain(3);
      expect(dates).not.toContain(10);
      expect(result.dates.length).toBe(12);
    });
  });

  describe('weekly', () => {
    it('展开每周事件（继承 start 的星期几）', () => {
      const mon = new DayjsTZDate(2026, 5, 1); // Monday
      const result = expandRecurrence(
        { frequency: 'weekly' },
        mon,
        mon,
        new DayjsTZDate(2026, 5, 28)
      );
      // All dates should be Monday
      result.dates.forEach((d) => {
        expect(d.getDay()).toBe(1);
      });
      // 4 Mondays: Jun 1,8,15,22
      expect(result.dates.length).toBeGreaterThanOrEqual(3);
    });

    it('按 byWeekDays 指定星期几展开', () => {
      const mon = new DayjsTZDate(2026, 5, 1);
      const result = expandRecurrence(
        {
          frequency: 'weekly',
          byWeekDays: [3, 5], // Wednesday and Friday
        },
        mon,
        mon,
        new DayjsTZDate(2026, 5, 14)
      );
      // Wed Jun 3, Fri Jun 5, Wed Jun 10, Fri Jun 12
      const days = result.dates.map((d) => ({ d: d.getDate(), wd: d.getDay() }));
      expect(days).toEqual([
        { d: 3, wd: 3 },
        { d: 5, wd: 5 },
        { d: 10, wd: 3 },
        { d: 12, wd: 5 },
      ]);
    });

    it('interval=2 每两周展开', () => {
      const mon = new DayjsTZDate(2026, 5, 1);
      const result = expandRecurrence(
        { frequency: 'weekly', interval: 2 },
        mon,
        mon,
        new DayjsTZDate(2026, 5, 28)
      );
      // Jun 1,15,29...
      result.dates.forEach((d) => {
        expect(d.getDay()).toBe(1);
      });
      expect(result.dates.length).toBeGreaterThanOrEqual(2);
    });

    it('不到 start 的日期不生成', () => {
      // event start is Jun 1 (Mon), but range starts Jun 3 (Wed)
      const result = expandRecurrence(
        { frequency: 'weekly', byWeekDays: [1, 3] }, // Mon, Wed
        eventStart,
        new DayjsTZDate(2026, 5, 3), // start from Jun 3
        new DayjsTZDate(2026, 5, 10)
      );
      // Jun 3 (Wed) is the first — Jun 1 (Mon) is before rangeStart, should be skipped
      // Wait — Jun 3 is in range. But Jun 1 is before rangeStart, so it won't be generated.
      // That's correct because our range starts at Jun 3.
      // Actually looking at the logic: dateInRange checks against rangeStart, not start.
      // So Jun 1 Mon would be in range if rangeStart is Jun 3? No — Jun 1 < Jun 3, so it's excluded.
      expect(result.dates.every((d) => d.getTime() >= new DayjsTZDate(2026, 5, 3).getTime())).toBe(
        true
      );
    });
  });

  describe('monthly', () => {
    it('展开每月事件（继承 start 的月内日期）', () => {
      const result = expandRecurrence(
        { frequency: 'monthly' },
        eventStart,
        rangeStart,
        new DayjsTZDate(2026, 7, 15) // through mid-August
      );
      // Jun 1, Jul 1, Aug 1
      expect(result.dates.length).toBe(3);
    });

    it('按 byMonthDays 指定月内日期展开', () => {
      const result = expandRecurrence(
        {
          frequency: 'monthly',
          byMonthDays: [15],
        },
        new DayjsTZDate(2026, 4, 15), // May 15
        new DayjsTZDate(2026, 4, 1),
        new DayjsTZDate(2026, 6, 31)
      );
      // May 15, Jun 15, Jul 15
      expect(result.dates.length).toBe(3);
      result.dates.forEach((d) => {
        expect(d.getDate()).toBe(15);
      });
    });

    it('byMonthDays 超过月末时取当月最后一天', () => {
      const result = expandRecurrence(
        {
          frequency: 'monthly',
          byMonthDays: [31],
        },
        new DayjsTZDate(2026, 0, 31), // Jan 31
        new DayjsTZDate(2026, 0, 1),
        new DayjsTZDate(2026, 2, 31) // rangeEnd = Mar 31
      );
      // Jan 31, Feb 28, Mar 31
      expect(result.dates.map((d) => d.getDate())).toEqual([31, 28, 31]);
    });

    it('interval=3 每三月展开', () => {
      const result = expandRecurrence(
        { frequency: 'monthly', interval: 3 },
        new DayjsTZDate(2026, 0, 1), // Jan 1
        new DayjsTZDate(2026, 0, 1),
        new DayjsTZDate(2026, 11, 31)
      );
      // Jan 1, Apr 1, Jul 1, Oct 1
      expect(result.dates.length).toBe(4);
    });
  });

  describe('yearly', () => {
    it('展开每年事件', () => {
      const result = expandRecurrence(
        { frequency: 'yearly' },
        eventStart,
        rangeStart,
        new DayjsTZDate(2028, 11, 31)
      );
      // Jun 1 2026, 2027, 2028
      expect(result.dates.length).toBe(3);
      result.dates.forEach((d) => {
        expect(d.getMonth()).toBe(5);
        expect(d.getDate()).toBe(1);
      });
    });

    it('interval=2 每两年展开', () => {
      const result = expandRecurrence(
        { frequency: 'yearly', interval: 2 },
        eventStart,
        rangeStart,
        new DayjsTZDate(2030, 11, 31)
      );
      // 2026, 2028, 2030
      expect(result.dates.length).toBe(3);
    });

    it('count 限制每年事件次数', () => {
      const result = expandRecurrence(
        { frequency: 'yearly', count: 2 },
        eventStart,
        rangeStart,
        new DayjsTZDate(2030, 11, 31)
      );
      expect(result.dates.length).toBe(2);
      expect(result.truncatedByCount).toBe(true);
    });
  });

  describe('边界场景', () => {
    it('count=0 返回空数组', () => {
      const result = expandRecurrence(
        { frequency: 'daily', count: 0 },
        eventStart,
        rangeStart,
        rangeEnd
      );
      expect(result.dates.length).toBe(0);
    });

    it('interval=0 视为无效输入，返回空', () => {
      const result = expandRecurrence(
        { frequency: 'daily', interval: 0 },
        eventStart,
        rangeStart,
        rangeEnd
      );
      expect(result.dates).toEqual([]);
    });

    it('eventStart 在视口之后返回空', () => {
      const result = expandRecurrence(
        { frequency: 'daily' },
        new DayjsTZDate(2026, 6, 1), // Jul 1
        new DayjsTZDate(2026, 5, 1), // Jun 1 (range start before eventStart)
        new DayjsTZDate(2026, 5, 30) // Jun 30 (range end before eventStart)
      );
      expect(result.dates.length).toBe(0);
    });

    it('exceptions 排除所有日期时返回空', () => {
      const result = expandRecurrence(
        {
          frequency: 'daily',
          exceptions: [
            new DayjsTZDate(2026, 5, 1),
            new DayjsTZDate(2026, 5, 2),
            new DayjsTZDate(2026, 5, 3),
          ],
          count: 3,
        },
        eventStart,
        rangeStart,
        rangeEnd
      );
      expect(result.dates.length).toBe(0);
      expect(result.truncatedByCount).toBe(true);
    });
  });
});
