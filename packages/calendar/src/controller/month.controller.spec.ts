import { describe, expect, it } from 'vitest';

import { DEFAULT_DAY_NAMES } from '@/helpers/dayName';
import { EventModel } from '@/model/eventModel';
import { Day } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';
import { MonthOptions, Options } from '@/types/options.type';

import { createEventCollection, createEvents } from './event.controller';
import {
  getMonthDayNames,
  getMonthEventRows,
  getMonthWeeks,
  MonthWeekEventData,
} from './month.controller';

function createMonthOptions(overrides: Partial<MonthOptions> = {}): Required<MonthOptions> {
  return {
    dayNames: [...DEFAULT_DAY_NAMES] as Required<MonthOptions>['dayNames'],
    startDayOfWeek: Day.SUN,
    narrowWeekend: false,
    workweek: false,
    isAlways6Weeks: true,
    visibleWeeksCount: 0,
    visibleEventCount: 4,
    dragToMove: true,
    dragToResize: true,
    dragToCreate: true,
    ...overrides,
  };
}

describe('month.controller', () => {
  it('getMonthDayNames 应按 startDayOfWeek 重排表头标签', () => {
    const options: Options = {
      month: createMonthOptions({
        startDayOfWeek: Day.MON,
      }),
    };

    const result = getMonthDayNames(options);

    expect(result.map((item) => item.label)).toEqual([
      '周一',
      '周二',
      '周三',
      '周四',
      '周五',
      '周六',
      '周日',
    ]);
  });

  it('getMonthDayNames 在 workweek=true 时应只保留工作日标签', () => {
    const options: Options = {
      month: createMonthOptions({
        startDayOfWeek: Day.MON,
        workweek: true,
      }),
    };

    const result = getMonthDayNames(options);

    expect(result.map((item) => item.label)).toEqual(['周一', '周二', '周三', '周四', '周五']);
  });

  it('getMonthWeeks 应按 startDayOfWeek 生成完整周矩阵', () => {
    const weeks = getMonthWeeks(
      new DayjsTZDate('2026-06-15T00:00:00'),
      createMonthOptions({
        startDayOfWeek: Day.MON,
        isAlways6Weeks: false,
      })
    );

    expect(weeks[0][0].getDay()).toBe(Day.MON);
    expect(weeks[0]).toHaveLength(7);
  });

  it('getMonthWeeks 在 workweek=true 时应仅输出工作日列', () => {
    const weeks = getMonthWeeks(
      new DayjsTZDate('2026-06-15T00:00:00'),
      createMonthOptions({
        startDayOfWeek: Day.MON,
        workweek: true,
        isAlways6Weeks: false,
      })
    );

    expect(weeks[0]).toHaveLength(5);
    expect(
      weeks.every((week) => week.every((date) => date.getDay() >= 1 && date.getDay() <= 5))
    ).toBe(true);
  });

  describe('getMonthEventRows', () => {
    // 2026-06，startDayOfWeek=SUN：weeks[1] = 6/7(日)…6/13(六)，6/9 在第 2 列
    const monthWeeks = () =>
      getMonthWeeks(new DayjsTZDate('2026-06-15T00:00:00'), createMonthOptions());

    function layout(events: EventObject[], visibleEventCount?: number): MonthWeekEventData[] {
      const calendarData: CalendarData = {
        calendars: [],
        events: createEventCollection<EventModel>(),
        idsOfDay: {},
      };
      createEvents(calendarData, events);
      return getMonthEventRows(calendarData, monthWeeks(), visibleEventCount);
    }

    function alldayEvent(id: string, start: string, end: string): EventObject {
      return {
        id,
        title: id,
        category: 'allday',
        allDay: true,
        start: new Date(start),
        end: new Date(end),
      };
    }

    it('单日事件 colspan=1，落在正确列', () => {
      const [, week1] = layout([alldayEvent('e', '2026-06-09T00:00:00', '2026-06-09T23:59:59')]);
      expect(week1.rows).toHaveLength(1);
      expect(week1.rows[0]).toMatchObject({ startCol: 2, colspan: 1, slotIndex: 0 });
    });

    it('同周多日事件按起止日算出 colspan', () => {
      // 6/8(一)–6/10(三)：col 1..3
      const [, week1] = layout([alldayEvent('e', '2026-06-08T00:00:00', '2026-06-10T23:59:59')]);
      expect(week1.rows[0]).toMatchObject({ startCol: 1, colspan: 3 });
    });

    it('跨周事件在两周各占一段（换行），分别按周裁剪', () => {
      // 6/12(五)–6/15(一)：week1 裁成 6/12–6/13(col5,2)，week2 裁成 6/14–6/15(col0,2)
      const rows = layout([alldayEvent('e', '2026-06-12T00:00:00', '2026-06-15T23:59:59')]);
      const week1 = rows[1].rows.find((r) => r.uiModel.model.id === 'e');
      const week2 = rows[2].rows.find((r) => r.uiModel.model.id === 'e');
      expect(week1).toMatchObject({ startCol: 5, colspan: 2 });
      expect(week2).toMatchObject({ startCol: 0, colspan: 2 });
    });

    it('同周重叠事件按 slotIndex 逐层堆叠', () => {
      const [, week1] = layout([
        alldayEvent('a', '2026-06-08T00:00:00', '2026-06-09T23:59:59'),
        alldayEvent('b', '2026-06-09T00:00:00', '2026-06-10T23:59:59'),
      ]);
      const slots = Object.fromEntries(week1.rows.map((r) => [r.uiModel.model.id, r.slotIndex]));
      expect(slots).toEqual({ a: 0, b: 1 });
    });

    it('超过 visibleEventCount 的事件计入 overflowByCol，不进入 rows（占满溢出）', () => {
      // 三个事件都压在 6/9（col2），visibleEventCount=2 → 2 个进 rows，1 个溢出
      const [, week1] = layout(
        [
          alldayEvent('a', '2026-06-09T00:00:00', '2026-06-09T23:59:59'),
          alldayEvent('b', '2026-06-09T00:00:00', '2026-06-09T23:59:59'),
          alldayEvent('c', '2026-06-09T00:00:00', '2026-06-09T23:59:59'),
        ],
        2
      );
      expect(week1.rows).toHaveLength(2);
      expect(week1.overflowByCol[2]).toBe(1);
    });

    it('占满后跨多列的溢出事件在每个覆盖列各计一次', () => {
      // 两个满 slot(visibleEventCount=1) + 一个跨 6/8–6/10 的溢出事件
      const [, week1] = layout(
        [
          alldayEvent('base', '2026-06-08T00:00:00', '2026-06-10T23:59:59'),
          alldayEvent('overflow', '2026-06-08T00:00:00', '2026-06-10T23:59:59'),
        ],
        1
      );
      expect(week1.rows).toHaveLength(1);
      // 6/8,6/9,6/10 → col 1,2,3 各 +1
      expect(week1.overflowByCol[1]).toBe(1);
      expect(week1.overflowByCol[2]).toBe(1);
      expect(week1.overflowByCol[3]).toBe(1);
    });
  });
});
