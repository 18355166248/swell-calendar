import { useEffect, useMemo, useState } from 'react';

import { WEEK_DAY_NAME_BORDER, WEEK_DAY_NAME_HEIGHT } from '@/constants/style.const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useThemeStore } from '@/contexts/themeStore';
import { getSchedulerViewEvents } from '@/controller/scheduler-layout';
import { getFlattenedVisibleResources, normalizeResources } from '@/controller/scheduler-resources';
import { cls } from '@/helpers/css';
import { createSchedulerTimeGridData, getWeekDates } from '@/helpers/grid';
import useTimeGridScrollSync from '@/hooks/TimeGrid/useTimeGridScrollSync';
import { toEndOfDay, toStartOfDay } from '@/time/datetime';

import Layout from '../Layout';
import Panel from '../Panel';
import { ResourceSidebar } from '../scheduler/ResourceSidebar';
import {
  SCHEDULER_ALLDAY_EVENT_HEIGHT,
  SchedulerAllDayLane,
} from '../scheduler/SchedulerAllDayLane';
import { SchedulerHeader } from '../scheduler/SchedulerHeader';
import { TimeGrid } from '../timeGrid/TimeGridView';

const SCHEDULER_HEADER_HEIGHT = WEEK_DAY_NAME_HEIGHT + 32 + WEEK_DAY_NAME_BORDER;
const RESOURCE_SIDEBAR_WIDTH = 120;

export function Scheduler() {
  const { options, calendar, view } = useCalendarStore();
  const { timeGridLeft } = useThemeStore((state) => state.week);
  const { renderDate } = view;
  const schedulerOptions = options.scheduler;
  const weekOptions = options.week;

  const [timePanelEl, setTimePanelEl] = useState<HTMLDivElement | null>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // 资源折叠状态
  const collapsedResourceIds = useCalendarStore((state) => state.collapsedResourceIds);
  const toggleCollapse = useCalendarStore((state) => state.toggleCollapse);
  const initCollapsedFromResources = useCalendarStore((state) => state.initCollapsedFromResources);

  // 初始化折叠状态
  useEffect(() => {
    if (schedulerOptions?.resources) {
      initCollapsedFromResources(schedulerOptions.resources);
    }
  }, [schedulerOptions?.resources, initCollapsedFromResources]);

  useEffect(() => {
    if (!timePanelEl) return;
    const measure = () => setScrollbarWidth(timePanelEl.offsetWidth - timePanelEl.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(timePanelEl);
    return () => ro.disconnect();
  }, [timePanelEl]);

  // 归一化资源并处理展开/折叠
  const allResources = useMemo(
    () => normalizeResources(schedulerOptions?.resources ?? []),
    [schedulerOptions?.resources]
  );

  const collapsedSet = useMemo(() => new Set(collapsedResourceIds), [collapsedResourceIds]);

  const resources = useMemo(
    () =>
      getFlattenedVisibleResources(
        schedulerOptions?.resources ?? [],
        schedulerOptions?.visibleResourceIds,
        collapsedSet
      ).filter((r) => !r.hidden),
    [schedulerOptions?.resources, schedulerOptions?.visibleResourceIds, collapsedSet]
  );

  const hasHierarchy = useMemo(
    () => allResources.some((r) => r.children && r.children.length > 0),
    [allResources]
  );

  const sidebarWidth = hasHierarchy ? RESOURCE_SIDEBAR_WIDTH : 0;

  // 副时区轴会加宽左侧 gutter，header / all-day lane 需同步对齐
  const schedulerTimezones = schedulerOptions?.timezones ?? [];
  const baseGutterWidth = parseInt(`${timeGridLeft.width}`, 10) || 72;
  const gutterWidth =
    schedulerTimezones.length > 0
      ? `${baseGutterWidth * (schedulerTimezones.length + 1)}px`
      : timeGridLeft.width;

  const hourStart = schedulerOptions?.hourStart ?? weekOptions?.hourStart ?? 0;
  const hourEnd = schedulerOptions?.hourEnd ?? weekOptions?.hourEnd ?? 24;
  const hourDivision = weekOptions?.hourDivision ?? 2;
  // 工作日模式：scheduler 可独立覆盖，缺省回退 week.workweek（与 hourStart/hourEnd 一致的回退）。
  const workweek = schedulerOptions?.workweek ?? weekOptions?.workweek;

  const weekDates = useMemo(
    () => getWeekDates(renderDate, { ...(weekOptions ?? {}), workweek }),
    [renderDate, weekOptions, workweek]
  );

  const { weekStart, weekEnd } = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[weekDates.length - 1];

    return {
      weekStart: toStartOfDay(first),
      weekEnd: toEndOfDay(last),
    };
  }, [weekDates]);

  const schedulerEvents = useMemo(
    () =>
      getSchedulerViewEvents(calendar, {
        start: weekStart,
        end: weekEnd,
        hourStart,
        hourEnd,
        displayTimezone: schedulerOptions?.displayTimezone,
      }),
    [calendar, hourStart, hourEnd, weekStart, weekEnd, schedulerOptions?.displayTimezone]
  );
  const alldayEvents = schedulerEvents.allday;
  const timeEvents = schedulerEvents.time;
  const maxAlldaySlot =
    alldayEvents.length > 0 ? Math.max(0, ...alldayEvents.map((m) => m.top)) : -1;
  const alldayPanelHeight =
    maxAlldaySlot >= 0 ? (maxAlldaySlot + 1) * SCHEDULER_ALLDAY_EVENT_HEIGHT : 0;

  const timeGridData = useMemo(
    () =>
      createSchedulerTimeGridData(weekDates, resources, {
        hourStart,
        hourEnd,
        hourDivision,
      }),
    [weekDates, resources, hourStart, hourEnd, hourDivision]
  );

  // 拖拽/缩放接近时间面板上下边缘时自动滚动（仅垂直，与 Week/Day 同构）
  useTimeGridScrollSync(timePanelEl, timeGridData.rows.length);

  if (resources.length === 0) {
    return (
      <div className={cls('scheduler-empty')}>
        <p>暂无资源配置，请通过 scheduler.resources 传入资源列表</p>
      </div>
    );
  }

  return (
    <Layout className={cls('scheduler-view')}>
      <Panel name="scheduler-header" initialHeight={SCHEDULER_HEADER_HEIGHT}>
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          {hasHierarchy ? (
            <ResourceSidebar
              resources={allResources}
              collapsedIds={collapsedResourceIds}
              onToggleCollapse={toggleCollapse}
              width={sidebarWidth}
            />
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <SchedulerHeader
              weekDates={weekDates}
              resources={resources}
              timeGridLeftWidth={gutterWidth}
              scrollbarWidth={scrollbarWidth}
            />
          </div>
        </div>
      </Panel>
      {alldayEvents.length > 0 ? (
        <Panel name="allday" initialHeight={alldayPanelHeight}>
          <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
            {hasHierarchy ? <div style={{ width: sidebarWidth, flexShrink: 0 }} /> : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              <SchedulerAllDayLane
                uiModels={alldayEvents}
                timeGridLeftWidth={gutterWidth}
                scrollbarWidth={scrollbarWidth}
              />
            </div>
          </div>
        </Panel>
      ) : null}
      <Panel name="time" ref={setTimePanelEl}>
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          {hasHierarchy ? (
            <div
              style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
                flexShrink: 0,
                borderRight: '1px solid #e8e8e8',
              }}
            />
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <TimeGrid timeGridData={timeGridData} events={timeEvents} />
          </div>
        </div>
      </Panel>
    </Layout>
  );
}
