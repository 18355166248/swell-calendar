import { useEffect, useMemo, useState } from 'react';

import { ALLDAY_EVENT_HEIGHT, AlldayRow } from '@/components/dayGrid/AlldayRow';
import GridHeader from '@/components/dayGridCommon/GridHeader';
import Layout from '@/components/Layout';
import Panel from '@/components/Panel';
import { TimeGrid } from '@/components/timeGrid/TimeGridView';
import { WEEK_DAY_NAME_BORDER, WEEK_DAY_NAME_HEIGHT } from '@/constants/style.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useThemeStore } from '@/contexts/themeStore';
import { getDayNames } from '@/helpers/dayName';
import { createTimeGridData, getWeekViewEvents } from '@/helpers/grid';
import { getActivePanels } from '@/helpers/view';
import { useDOMNode } from '@/hooks/common/useDOMNode';
import { useViewportTier } from '@/hooks/common/useViewportTier';
import useTimeGridScrollSync from '@/hooks/TimeGrid/useTimeGridScrollSync';
import { getFilterRange, getRowStyleInfo } from '@/time/datetime';
import { WeekOptions } from '@/types/options.type';
import { getTierClassName } from '@/utils/viewport';

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
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [viewportTier, setViewportRef] = useViewportTier();

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

  useEffect(() => {
    if (!timeGridRef) return;

    const measure = () => setScrollbarWidth(timeGridRef.offsetWidth - timeGridRef.clientWidth);

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(measure);
    ro.observe(timeGridRef);

    return () => ro.disconnect();
  }, [timeGridRef]);

  const alldayModels = dayGridEvents.allday;
  const maxAlldaySlot =
    alldayModels.length > 0 ? Math.max(0, ...alldayModels.map((m) => m.top)) : -1;
  const alldayPanelHeight = maxAlldaySlot >= 0 ? (maxAlldaySlot + 1) * ALLDAY_EVENT_HEIGHT : 0;
  const rightInset = `${scrollbarWidth}px`;

  return (
    <Layout className={getTierClassName('day-view', viewportTier)} rootRef={setViewportRef}>
      <Panel name="day-view-day-names" initialHeight={WEEK_DAY_NAME_HEIGHT + WEEK_DAY_NAME_BORDER}>
        <GridHeader
          type="week"
          marginLeft={timeGridLeftWidth}
          rightInset={rightInset}
          dayNames={dayNames}
          rowStyleInfo={rowStyleInfo}
        />
      </Panel>

      {activePanels.includes('allday') && alldayModels.length > 0 ? (
        <Panel name="allday" initialHeight={alldayPanelHeight}>
          <AlldayRow
            uiModels={alldayModels}
            marginLeft={timeGridLeftWidth}
            rightInset={rightInset}
          />
        </Panel>
      ) : null}

      {activePanels.includes('time') ? (
        <Panel name="time" ref={setTimeGridRef}>
          <TimeGrid timeGridData={timeGridData} events={dayGridEvents.time} />
        </Panel>
      ) : null}
    </Layout>
  );
}

Day.displayName = 'Day';
