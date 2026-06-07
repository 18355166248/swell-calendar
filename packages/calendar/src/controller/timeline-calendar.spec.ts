import { describe, expect, it } from 'vitest';

import { EventModel } from '@/model/eventModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';
import Collection from '@/utils/collection';

import {
  buildCreatedAlldayEvent,
  computeMovedEvent,
  computeResizedEvent,
  getCalendarTimelineDays,
  getCalendarTimelineRow,
  getTimelineDayIndexFromX,
  getTimelineResourceIndexFromY,
} from './timeline-calendar';

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

  describe('交互几何', () => {
    it('getTimelineDayIndexFromX 按 cellWidth 取整并 clamp', () => {
      expect(getTimelineDayIndexFromX(0, 48, 30)).toBe(0);
      expect(getTimelineDayIndexFromX(100, 48, 30)).toBe(2);
      expect(getTimelineDayIndexFromX(-20, 48, 30)).toBe(0);
      expect(getTimelineDayIndexFromX(9999, 48, 30)).toBe(29);
    });

    it('getTimelineResourceIndexFromY 按累加行高定位并 clamp', () => {
      const heights = [44, 44, 66];
      expect(getTimelineResourceIndexFromY(0, heights)).toBe(0);
      expect(getTimelineResourceIndexFromY(50, heights)).toBe(1);
      expect(getTimelineResourceIndexFromY(100, heights)).toBe(2);
      expect(getTimelineResourceIndexFromY(9999, heights)).toBe(2);
      expect(getTimelineResourceIndexFromY(-5, heights)).toBe(0);
    });

    it('computeMovedEvent 按天平移、保留时刻、可改资源', () => {
      const prev = {
        start: new DayjsTZDate('2026-06-05T09:30:00'),
        end: new DayjsTZDate('2026-06-05T10:30:00'),
        resourceId: 'r1',
      } as unknown as EventObject;

      const moved = computeMovedEvent(prev, 2, 'r2');
      const start = new DayjsTZDate(moved.start);
      const end = new DayjsTZDate(moved.end);
      expect(start.dayjs.date()).toBe(7);
      expect(start.dayjs.hour()).toBe(9);
      expect(start.dayjs.minute()).toBe(30);
      expect(end.dayjs.date()).toBe(7);
      expect(moved.resourceId).toBe('r2');
    });

    it('computeResizedEvent 改起/止天并 clamp 防反向', () => {
      const prev = {
        start: new DayjsTZDate('2026-06-05T09:00:00'),
        end: new DayjsTZDate('2026-06-08T10:00:00'),
      } as unknown as EventObject;

      const startResized = computeResizedEvent(prev, 'start', -2);
      expect(new DayjsTZDate(startResized.start).dayjs.date()).toBe(3);

      const endResized = computeResizedEvent(prev, 'end', 2);
      expect(new DayjsTZDate(endResized.end).dayjs.date()).toBe(10);

      // start 拖过 end → clamp 到 end
      const clamped = computeResizedEvent(prev, 'start', 10);
      expect(new DayjsTZDate(clamped.start).getTime()).toBe(new DayjsTZDate(prev.end).getTime());
    });

    it('buildCreatedAlldayEvent 生成跨天全天事件并校正起止顺序', () => {
      const created = buildCreatedAlldayEvent(
        'r1',
        new DayjsTZDate('2026-06-10T00:00:00'),
        new DayjsTZDate('2026-06-08T00:00:00')
      );
      expect(created.allDay).toBe(true);
      expect(created.resourceId).toBe('r1');
      const start = new DayjsTZDate(created.start);
      const end = new DayjsTZDate(created.end);
      expect(start.dayjs.date()).toBe(8);
      expect(start.dayjs.hour()).toBe(0);
      expect(end.dayjs.date()).toBe(10);
      expect(end.dayjs.hour()).toBe(23);
    });
  });
});
