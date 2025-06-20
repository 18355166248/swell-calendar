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
import { getRowStyleInfo } from '@/time/datetime';
import GridHeader from '@/components/dayGridCommon/GridHeader';
import { getDayNames } from '@/helpers/dayName';

export interface DayProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function Day({ children, ...other }: DayProps): JSX.Element {
  const { options, view } = useCalendarStore();
  const { week } = useThemeStore();
  const timeGridLeftWidth = week.timeGridLeft.width;
  const { renderDate } = view;
  const weekOptions = options.week as Required<WeekOptions>;
  const {
    narrowWeekend,
    startDayOfWeek,
    workweek,
    hourDivision,
    hourStart,
    hourEnd,
    taskView,
    eventView,
  } = weekOptions;
  const activePanels = getActivePanels(taskView, eventView);

  // 创建包含当前渲染日期的数组（日视图只显示一天）
  const days = useMemo(() => [renderDate], [renderDate]);

  const dayNames = getDayNames(days, options.week?.dayNames ?? []);

  // 计算行样式信息和单元格宽度映射
  const { rowStyleInfo } = getRowStyleInfo(days.length, narrowWeekend, startDayOfWeek, workweek);

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
      <Panel name="day-view-day-names" initialHeight={WEEK_DAY_NAME_HEIGHT + WEEK_DAY_NAME_BORDER}>
        <GridHeader
          type="week"
          marginLeft={timeGridLeftWidth}
          dayNames={dayNames}
          rowStyleInfo={rowStyleInfo}
        />
      </Panel>
      {activePanels.includes('time') ? (
        <Panel name="time">
          <TimeGrid timeGridData={timeGridData} />
        </Panel>
      ) : null}
    </Layout>
  );
}

Day.displayName = 'Day';
