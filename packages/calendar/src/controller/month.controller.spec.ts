import { describe, expect, it } from 'vitest';

import { DEFAULT_DAY_NAMES } from '@/helpers/dayName';
import { Day } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { MonthOptions, Options } from '@/types/options.type';

import { getMonthDayNames, getMonthWeeks } from './month.controller';

function createMonthOptions(overrides: Partial<MonthOptions> = {}): Required<MonthOptions> {
  return {
    dayNames: [...DEFAULT_DAY_NAMES] as Required<MonthOptions>['dayNames'],
    startDayOfWeek: Day.SUN,
    narrowWeekend: false,
    workweek: false,
    isAlways6Weeks: true,
    visibleWeeksCount: 0,
    visibleEventCount: 4,
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
});
