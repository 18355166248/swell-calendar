import { useMemo } from 'react';
import { useCalendarStore } from '@/contexts/calendarStore';
import { getActivePanels } from '@/helpers/view';
import { TimeGrid } from '@/components/timeGrid/TimeGrid';
import { useThemeStore } from '@/contexts/themeStore';
import { WeekOptions } from '@/types/options.type';
import { createTimeGridData, getWeekViewEvents } from '@/helpers/grid';
import Layout from '@/components/Layout';
import Panel from '@/components/Panel';
import { WEEK_DAY_NAME_BORDER, WEEK_DAY_NAME_HEIGHT } from '@/constants/style.const';
import { getFilterRange, getRowStyleInfo } from '@/time/datetime';
import GridHeader from '@/components/dayGridCommon/GridHeader';
import { getDayNames } from '@/helpers/dayName';
import { useDOMNode } from '@/hooks/common/useDOMNode';
import useTimeGridScrollSync from '@/hooks/TimeGrid/useTimeGridScrollSync';

export function Day(): JSX.Element {
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

  const [timeGridRef, setTimeGridRef] = useDOMNode<HTMLDivElement>();

  // 创建包含当前渲染日期的数组（日视图只显示一天）
  const days = useMemo(() => [renderDate], [renderDate]);

  const dayNames = getDayNames(days, options.week?.dayNames ?? []);

  // 获取日历数据
  const calendar = useCalendarStore((state) => state.calendar);

  const [weekStartDate, weekEndDate] = getFilterRange(days[0]);

  // 获取周视图事件数据
  const dayGridEvents = useMemo(() => {
    return getWeekViewEvents(days, calendar, {
      narrowWeekend,
      hourStart,
      hourEnd,
      weekStartDate,
      weekEndDate,
    });
  }, [calendar, days, hourEnd, hourStart, narrowWeekend, weekStartDate, weekEndDate]);

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
    [days, hourDivision, hourEnd, hourStart, narrowWeekend]
  );

  // 同步向上向下滚动
  useTimeGridScrollSync(timeGridRef, timeGridData.rows.length);

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
        <Panel name="time" ref={setTimeGridRef}>
          <TimeGrid timeGridData={timeGridData} />
        </Panel>
      ) : null}
    </Layout>
  );
}

Day.displayName = 'Day';
