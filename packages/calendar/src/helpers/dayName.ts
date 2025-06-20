import DayjsTZDate from '@/time/dayjs-tzdate';
import { TemplateWeekDayName } from '@/types/template.type';
import { capitalize } from 'lodash-es';

export const DEFAULT_DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const getDayName = (dayIndex: number) => {
  return DEFAULT_DAY_NAMES[dayIndex];
};

export function getDayNames(days: DayjsTZDate[], weekDayNamesOption: string[] | []) {
  return days.map<TemplateWeekDayName>((day) => {
    const dayIndex = day.dayjs.day();
    console.log('🚀 ~ getDayNames ~ dayIndex:', dayIndex);
    const dayName =
      weekDayNamesOption.length > 0
        ? weekDayNamesOption[dayIndex]
        : capitalize(getDayName(dayIndex));

    return {
      date: day.dayjs.date(),
      day: day.dayjs.day(),
      dayName,
      isToday: true,
      renderDate: 'date',
      dateInstance: day,
    };
  });
}
