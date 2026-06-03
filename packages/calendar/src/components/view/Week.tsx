import { useMemo } from 'react';

import { WEEK_DAY_NAME_BORDER, WEEK_DAY_NAME_HEIGHT } from '@/constants/style.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useThemeStore } from '@/contexts/themeStore';
import { cls } from '@/helpers/css';
import { getDayNames } from '@/helpers/dayName';
import { createTimeGridData, getWeekDates, getWeekViewEvents } from '@/helpers/grid';
import { getActivePanels } from '@/helpers/view';
import { useDOMNode } from '@/hooks/common/useDOMNode';
import useTimeGridScrollSync from '@/hooks/TimeGrid/useTimeGridScrollSync';
import { getRowStyleInfo, toEndOfDay, toStartOfDay } from '@/time/datetime';
import { WeekOptions } from '@/types/options.type';

import { ALLDAY_EVENT_HEIGHT, AlldayRow } from '../dayGrid/AlldayRow';
import GridHeader from '../dayGridCommon/GridHeader';
import Layout from '../Layout';
import Panel from '../Panel';
import { TimeGrid } from '../timeGrid/TimeGridView';

/**
 * 周视图状态管理钩子
 *
 * 从全局状态中获取周视图所需的所有数据：
 * - options: 日历配置选项
 * - calendar: 日历数据
 * - gridRowLayout: 网格行布局信息
 * - lastPanelType: 最后一个面板类型
 * - renderDate: 当前渲染日期
 */
function useWeekViewState() {
  const { options, view, layout, calendar } = useCalendarStore();

  const { weekViewLayout } = layout;

  const { dayGridRows: gridRowLayout, lastPanelType } = weekViewLayout;

  const { renderDate } = view;

  return useMemo(
    () => ({
      options,
      calendar,
      gridRowLayout,
      lastPanelType,
      renderDate,
    }),
    [calendar, gridRowLayout, lastPanelType, options, renderDate]
  );
}

export function Week() {
  // 获取周视图状态
  const { options, calendar, renderDate } = useWeekViewState();
  // 获取主题中的网格头部左边距
  const { timeGridLeft } = useThemeStore((state) => state.week);

  const { width: timeGridLeftWidth } = timeGridLeft;

  // 时间面板的DOM引用
  const [timePanel, setTimePanelRef] = useDOMNode<HTMLDivElement>();

  // 提取周视图选项
  const weekOptions = options.week as Required<WeekOptions>;

  const {
    narrowWeekend,
    startDayOfWeek,
    workweek,
    hourStart,
    hourEnd,
    eventView,
    taskView,
    hourDivision,
  } = weekOptions;

  // 计算一周的日期范围
  const weekDates = useMemo(() => getWeekDates(renderDate, weekOptions), [renderDate, weekOptions]);

  // 获取星期名称
  const dayNames = getDayNames(weekDates, options.week?.dayNames ?? []);

  // 计算行样式信息和单元格宽度映射
  const { rowStyleInfo } = getRowStyleInfo(
    weekDates.length,
    narrowWeekend,
    startDayOfWeek,
    workweek
  );

  // 获取周视图事件数据
  const dayGridEvents = useMemo(() => {
    // 获取过滤范围
    const getFilterRange = () => {
      return [toStartOfDay(weekDates[0]), toEndOfDay(weekDates[weekDates.length - 1])];
    };

    const [weekStartDate, weekEndDate] = getFilterRange();

    return getWeekViewEvents(weekDates, calendar, {
      narrowWeekend,
      hourStart,
      hourEnd,
      weekStartDate,
      weekEndDate,
    });
  }, [weekDates, calendar, narrowWeekend, hourStart, hourEnd]);

  // 创建时间网格数据
  const timeGridData = useMemo(
    () =>
      createTimeGridData(weekDates, {
        hourStart,
        hourEnd,
        hourDivision,
        narrowWeekend,
      }),
    [hourEnd, hourStart, hourDivision, narrowWeekend, weekDates]
  );

  // 获取活动的面板列表
  const activePanels = getActivePanels(taskView, eventView);

  // 同步时间网格滚动
  useTimeGridScrollSync(timePanel, timeGridData.rows.length);

  const alldayModels = dayGridEvents.allday;
  const maxAlldaySlot =
    alldayModels.length > 0 ? Math.max(0, ...alldayModels.map((m) => m.top)) : -1;
  const alldayPanelHeight = maxAlldaySlot >= 0 ? (maxAlldaySlot + 1) * ALLDAY_EVENT_HEIGHT : 0;

  return (
    <Layout className={cls('week-view')}>
      <Panel name="week-view-day-names" initialHeight={WEEK_DAY_NAME_HEIGHT + WEEK_DAY_NAME_BORDER}>
        <GridHeader
          type="week"
          marginLeft={timeGridLeftWidth}
          dayNames={dayNames}
          rowStyleInfo={rowStyleInfo}
        />
      </Panel>

      {activePanels.includes('allday') && alldayModels.length > 0 ? (
        <Panel name="allday" initialHeight={alldayPanelHeight}>
          <AlldayRow uiModels={alldayModels} marginLeft={timeGridLeftWidth} />
        </Panel>
      ) : null}

      {activePanels.includes('time') ? (
        <Panel name="time" ref={setTimePanelRef}>
          <TimeGrid timeGridData={timeGridData} events={dayGridEvents.time} />
        </Panel>
      ) : null}
    </Layout>
  );
}
