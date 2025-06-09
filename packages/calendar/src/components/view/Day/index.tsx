import { ButtonHTMLAttributes, ReactNode, useMemo } from 'react';
import { useCalendarStore } from '@/contexts/calendarStore';
import { getActivePanels } from '@/helpers/view';
import { TimeGrid } from '@/components/timeGrid/TimeGrid';
import { useThemeStore } from '@/contexts/themeStore';
import { WeekOptions } from '@/types/options.type';
import { createTimeGridData } from '@/helpers/grid';
import Layout from '@/components/Layout';
import Panel from '@/components/Panel';
import { WEEK_DAY_NAME_BORDER, WEEK_DAY_NAME_HEIGHT } from '@/constants/style.const';

export interface DayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Day({ children, ...other }: DayProps): JSX.Element {
  const { options, view } = useCalendarStore();
  const { week } = useThemeStore();
  const { renderDate } = view;
  const weekOptions = options.week as Required<WeekOptions>;
  const { narrowWeekend, hourDivision, hourStart, hourEnd, taskView, eventView } = weekOptions;
  const activePanels = getActivePanels(taskView, eventView);

  // 创建包含当前渲染日期的数组（日视图只显示一天）
  const days = useMemo(() => [renderDate], [renderDate]);

  const timeGridData = useMemo(
    () =>
      createTimeGridData(days, {
        hourStart,
        hourEnd,
        hourDivision,
        narrowWeekend,
      }),
    [days, hourEnd, hourStart]
  );

  return (
    <Layout className="day-view">
      <Panel
        name="day-view-day-names"
        initialHeight={WEEK_DAY_NAME_HEIGHT + WEEK_DAY_NAME_BORDER}
      ></Panel>
      {activePanels.includes('time') ? (
        <Panel name="time">
          <TimeGrid timeGridData={timeGridData} />
        </Panel>
      ) : null}
    </Layout>
  );
}

Day.displayName = 'Day';
