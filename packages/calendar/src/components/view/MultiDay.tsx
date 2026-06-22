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
import { getRowStyleInfo, toEndOfDay, toStartOfDay } from '@/time/datetime';
import { getVisibleDateWindow, normalizeRange } from '@/time/view-range';
import { MultiDayOptions, WeekOptions } from '@/types/options.type';
import { getTierClassName } from '@/utils/viewport';

const MOBILE_TIME_GRID_LEFT_WIDTH = '44px';
const MOBILE_DAY_NAME_PANEL_HEIGHT = 32;

export function MultiDay(): JSX.Element {
  const { options, view, calendar } = useCalendarStore();
  const { week } = useThemeStore();
  const timeGridLeftWidth = week.timeGridLeft.width;
  const { renderDate } = view;
  const weekOptions = options.week as Required<WeekOptions>;
  const multiDayOptions = options.multiDay as Required<MultiDayOptions>;
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
  const range = normalizeRange(multiDayOptions.range) ?? 2;

  const [timeGridRef, setTimeGridRef] = useDOMNode<HTMLDivElement>();
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const [viewportTier, setViewportRef] = useViewportTier();
  // 多日移动视图复用 Day/Week 的三段式网格，左侧 gutter 必须统一传入三段组件，
  // 否则 header、全天行和时间网格会在窄屏出现列线错位。
  const effectiveTimeGridLeftWidth =
    viewportTier === 'mobile' ? MOBILE_TIME_GRID_LEFT_WIDTH : timeGridLeftWidth;

  const days = useMemo(
    () => getVisibleDateWindow(renderDate, range, workweek),
    [range, renderDate, workweek]
  );

  const dayNames = getDayNames(days, options.week?.dayNames ?? []);

  const dayGridEvents = useMemo(() => {
    if (days.length === 0) {
      return { allday: [], time: [], milestone: [], task: [] };
    }

    return getWeekViewEvents(days, calendar, {
      narrowWeekend,
      hourStart,
      hourEnd,
      weekStartDate: toStartOfDay(days[0]),
      weekEndDate: toEndOfDay(days[days.length - 1]),
    });
  }, [calendar, days, hourEnd, hourStart, narrowWeekend]);

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
  const dayNamePanelHeight =
    viewportTier === 'mobile'
      ? MOBILE_DAY_NAME_PANEL_HEIGHT
      : WEEK_DAY_NAME_HEIGHT + WEEK_DAY_NAME_BORDER;
  const dayNamePanelName =
    viewportTier === 'mobile' ? 'multi-day-view-day-names-mobile' : 'multi-day-view-day-names';

  return (
    <Layout className={getTierClassName('multi-day-view', viewportTier)} rootRef={setViewportRef}>
      <Panel name={dayNamePanelName} initialHeight={dayNamePanelHeight}>
        <GridHeader
          type="week"
          marginLeft={effectiveTimeGridLeftWidth}
          rightInset={rightInset}
          dayNames={dayNames}
          rowStyleInfo={rowStyleInfo}
        />
      </Panel>

      {activePanels.includes('allday') && alldayModels.length > 0 ? (
        <Panel name="allday" initialHeight={alldayPanelHeight}>
          <AlldayRow
            uiModels={alldayModels}
            marginLeft={effectiveTimeGridLeftWidth}
            rightInset={rightInset}
          />
        </Panel>
      ) : null}

      {activePanels.includes('time') ? (
        <Panel name="time" ref={setTimeGridRef}>
          <TimeGrid
            timeGridData={timeGridData}
            events={dayGridEvents.time}
            gutterWidthOverride={effectiveTimeGridLeftWidth}
          />
        </Panel>
      ) : null}
    </Layout>
  );
}

MultiDay.displayName = 'MultiDay';
