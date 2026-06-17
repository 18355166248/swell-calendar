import { capitalize } from 'lodash-es';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { TemplateWeekDayName } from '@/types/template.type';

export const DEFAULT_DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const getDayName = (dayIndex: number) => {
  return DEFAULT_DAY_NAMES[dayIndex];
};

export function getDayNames(days: DayjsTZDate[], weekDayNamesOption: string[] | []) {
  const today = new DayjsTZDate();

  return days.map<TemplateWeekDayName>((day) => {
    const dayIndex = day.dayjs.day();
    const dayName =
      weekDayNamesOption.length > 0
        ? weekDayNamesOption[dayIndex]
        : capitalize(getDayName(dayIndex));

    return {
      date: day.dayjs.date(),
      day: day.dayjs.day(),
      dayName,
      // 标题高亮只应该命中真实今天，不能把整周都标成 today。
      isToday: day.dayjs.isSame(today.dayjs, 'day'),
      renderDate: 'date',
      dateInstance: day,
    };
  });
}
