import { DEFAULT_DAY_NAME_MARGIN_LEFT } from '@/constants/style.const';
import { cls, toPercent } from '@/helpers/css';
import { CalendarViewType } from '@/types/components/common.type';
import { CellStyle } from '@/types/datetime.type';
import { TemplateMonthDayName, TemplateWeekDayName } from '@/types/template.type';
import DayName from './DayName';
import { useThemeStore } from '@/contexts/themeStore';
import { CommonTheme, MonthTheme, ThemeState, WeekTheme } from '@/types/theme.type';
import { useMemo } from 'react';

type TemplateDayNames = (TemplateWeekDayName | TemplateMonthDayName)[];

interface GridHeaderProps {
  dayNames: TemplateDayNames;
  marginLeft?: string;
  type: CalendarViewType;
  rowStyleInfo: CellStyle[];
}

export type DayNameThemes = {
  common: {
    saturday: CommonTheme['saturday'];
    holiday: CommonTheme['holiday'];
    today: CommonTheme['today'];
    dayName: CommonTheme['dayName'];
  };
  week?: {
    pastDay: WeekTheme['pastDay'];
    today: WeekTheme['today'];
    dayName: WeekTheme['dayName'];
  };
  month?: {
    dayName: MonthTheme['dayName'];
  };
};

function GridHeader({
  dayNames,
  marginLeft = DEFAULT_DAY_NAME_MARGIN_LEFT,
  type = 'month',
  rowStyleInfo,
}: GridHeaderProps) {
  const commonTheme = useThemeStore((theme: ThemeState) => theme.common);
  const weekTheme = useThemeStore((theme: ThemeState) => theme.week);
  const monthTheme = useThemeStore((theme: ThemeState) => theme.month);

  // 直接使用选择器函数，不需要 useMemo 包装
  const monthThemeData = useMemo(
    () => ({
      common: {
        saturday: commonTheme.saturday,
        holiday: commonTheme.holiday,
        today: commonTheme.today,
        dayName: commonTheme.dayName,
      },
      month: {
        dayName: monthTheme.dayName,
      },
    }),
    [
      commonTheme.dayName,
      commonTheme.holiday,
      commonTheme.saturday,
      commonTheme.today,
      monthTheme.dayName,
    ]
  );
  const weekThemeData = useMemo(
    () => ({
      common: {
        saturday: commonTheme.saturday,
        holiday: commonTheme.holiday,
        today: commonTheme.today,
        dayName: commonTheme.dayName,
      },
      week: {
        pastDay: weekTheme.pastDay,
        today: weekTheme.today,
        dayName: weekTheme.dayName,
      },
    }),
    [
      commonTheme.dayName,
      commonTheme.holiday,
      commonTheme.saturday,
      commonTheme.today,
      weekTheme.pastDay,
      weekTheme.today,
      weekTheme.dayName,
    ]
  );

  const theme: DayNameThemes = useMemo(
    () => (type === 'month' ? monthThemeData : weekThemeData),
    [monthThemeData, type, weekThemeData]
  );

  const { backgroundColor = 'white', borderLeft = 'none', ...rest } = theme[type]?.dayName ?? {};
  const { borderTop = null, borderBottom = null } = rest as WeekTheme['dayName'];

  const style = {
    backgroundColor,
    borderTop: borderTop ?? 'none',
    borderBottom: borderBottom ?? 'none',
  };

  return (
    <div className={cls('day-names')} style={style}>
      <div className={cls('day-names-container')} style={{ marginLeft }}>
        {dayNames.map((dayName, index) => (
          <DayName
            key={dayName.day}
            dayName={dayName}
            type={type}
            style={{
              width: toPercent(rowStyleInfo[index].width),
              left: toPercent(rowStyleInfo[index].left),
              borderLeft,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default GridHeader;
