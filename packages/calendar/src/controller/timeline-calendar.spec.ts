import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import Collection from '@/utils/collection';

import { getCalendarTimelineDays, getCalendarTimelineRow } from './timeline-calendar';

function makeCalendar(events: EventModel[]): CalendarData {
  const collection = new Collection<EventModel>((model) => model.cid());
  events.forEach((e) => collection.add(e));
  return { calendars: [], events: collection, idsOfDay: {} };
}

describe('timeline-calendar', () => {
  describe('getCalendarTimelineDays', () => {
    it('返回 renderDate 所在自然月的每一天', () => {
      const days = getCalendarTimelineDays(new DayjsTZDate('2026-06-15T00:00:00'));
      expect(days).toHaveLength(30);
      expect(days[0].dayjs.date()).toBe(1);
      expect(days[0].dayjs.month()).toBe(5); // 0-based → 6 月
      expect(days[29].dayjs.date()).toBe(30);
    });

    it('正确处理 2 月（含 28 天月份）', () => {
      const days = getCalendarTimelineDays(new DayjsTZDate('2026-02-10T00:00:00'));
      expect(days).toHaveLength(28);
    });
  });

  describe('getCalendarTimelineRow', () => {
    const days = getCalendarTimelineDays(new DayjsTZDate('2026-06-15T00:00:00'));

    it('计算事件的起止天列索引并跨多天', () => {
      const calendar = makeCalendar([
        new EventModel({
          id: 'a',
          title: '跨多天',
          start: new DayjsTZDate('2026-06-02T09:00:00'),
          end: new DayjsTZDate('2026-06-06T18:00:00'),
          resourceId: 'r1',
        }),
      ]);

      const row = getCalendarTimelineRow(calendar, 'r1', days);
      expect(row.items).toHaveLength(1);
      expect(row.items[0].startDayIndex).toBe(1); // 6/2
      expect(row.items[0].endDayIndex).toBe(5); // 6/6
      expect(row.laneCount).toBe(1);
    });

    it('同资源行内重叠事件分车道，不重叠则复用车道', () => {
      const calendar = makeCalendar([
        new EventModel({
          id: 'a',
          title: 'A',
          start: new DayjsTZDate('2026-06-02T09:00:00'),
          end: new DayjsTZDate('2026-06-06T18:00:00'),
          resourceId: 'r1',
        }),
        new EventModel({
          id: 'b',
          title: 'B',
          start: new DayjsTZDate('2026-06-09T10:00:00'),
          end: new DayjsTZDate('2026-06-09T11:00:00'),
          resourceId: 'r1',
        }),
        new EventModel({
          id: 'c',
          title: 'C',
          start: new DayjsTZDate('2026-06-09T14:00:00'),
          end: new DayjsTZDate('2026-06-10T15:00:00'),
          resourceId: 'r1',
        }),
      ]);

      const row = getCalendarTimelineRow(calendar, 'r1', days);
      const byId = Object.fromEntries(row.items.map((it) => [it.uiModel.model.id, it]));

      // A 与 B 不重叠（5 < 8）→ 同车道 0
      expect(byId.a.lane).toBe(0);
      expect(byId.b.lane).toBe(0);
      // C 与 B 在 6/9 重叠 → 车道 1
      expect(byId.c.lane).toBe(1);
      expect(row.laneCount).toBe(2);
    });

    it('超出可视范围的事件被 clamp 并标记 exceedLeft / exceedRight', () => {
      const calendar = makeCalendar([
        new EventModel({
          id: 'left',
          title: '左越界',
          start: new DayjsTZDate('2026-05-30T09:00:00'),
          end: new DayjsTZDate('2026-06-02T18:00:00'),
          resourceId: 'r1',
        }),
        new EventModel({
          id: 'right',
          title: '右越界',
          start: new DayjsTZDate('2026-06-29T09:00:00'),
          end: new DayjsTZDate('2026-07-03T18:00:00'),
          resourceId: 'r1',
        }),
      ]);

      const row = getCalendarTimelineRow(calendar, 'r1', days);
      const byId = Object.fromEntries(row.items.map((it) => [it.uiModel.model.id, it]));

      expect(byId.left.startDayIndex).toBe(0);
      expect(byId.left.exceedLeft).toBe(true);
      expect(byId.right.endDayIndex).toBe(29);
      expect(byId.right.exceedRight).toBe(true);
    });

    it('通过 resourceIds 匹配共享事件', () => {
      const calendar = makeCalendar([
        new EventModel({
          id: 'shared',
          title: '共享',
          start: new DayjsTZDate('2026-06-05T09:00:00'),
          end: new DayjsTZDate('2026-06-05T10:00:00'),
          resourceIds: ['r2', 'r3'],
        }),
      ]);

      expect(getCalendarTimelineRow(calendar, 'r2', days).items).toHaveLength(1);
      expect(getCalendarTimelineRow(calendar, 'r3', days).items).toHaveLength(1);
      expect(getCalendarTimelineRow(calendar, 'r1', days).items).toHaveLength(0);
    });
  });
});
