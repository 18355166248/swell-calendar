import { useEffect, useMemo, useRef, useState } from 'react';

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
import TimeColumn from '../timeGrid/TimeColumn';
import { TimeGrid } from '../timeGrid/TimeGridView';

const SCHEDULER_HEADER_HEIGHT = WEEK_DAY_NAME_HEIGHT + 32 + WEEK_DAY_NAME_BORDER;
const RESOURCE_SIDEBAR_WIDTH = 120;

export function Scheduler() {
  const { options, calendar, view } = useCalendarStore();
  const { timeGridLeft } = useThemeStore((state) => state.week);
  const { renderDate } = view;
  const schedulerOptions = options.scheduler;
  const weekOptions = options.week;

  const timePanelRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // 固定列宽模式
  const columnWidth = schedulerOptions?.columnWidth;

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
    const el = timePanelRef.current;
    if (!el) return;
    const measure = () => setScrollbarWidth(el.offsetWidth - el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [columnWidth]);

  // 固定列宽模式：gutter 时间轴与 time panel 垂直滚动同步（原生事件，确保程序化滚动也触发）
  const gutterTimeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!columnWidth) return;
    const panel = timePanelRef.current;
    const gutter = gutterTimeRef.current;
    if (!panel || !gutter) return;
    const sync = () => {
      gutter.scrollTop = panel.scrollTop;
    };
    panel.addEventListener('scroll', sync, { passive: true });
    return () => panel.removeEventListener('scroll', sync);
  }, [columnWidth]);

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
        columnWidth,
      }),
    [weekDates, resources, hourStart, hourEnd, hourDivision, columnWidth]
  );

  // 固定列宽模式：网格总像素宽度
  const gridPixelWidth = columnWidth ? timeGridData.columns.length * columnWidth : undefined;

  // 拖拽/缩放接近时间面板上下边缘时自动滚动（仅垂直，与 Week/Day 同构）
  useTimeGridScrollSync(timePanelRef.current, timeGridData.rows.length);

  if (resources.length === 0) {
    return (
      <div className={cls('scheduler-empty')}>
        <p>暂无资源配置，请通过 scheduler.resources 传入资源列表</p>
      </div>
    );
  }

  // ─── 固定列宽模式：绕过 Panel 系统，header/allday/time 共享单一水平滚动容器 ───
  if (columnWidth) {
    return (
      <Layout className={cls('scheduler-view')}>
        <div
          className={cls('scheduler-scroll')}
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0 }}>
            {/* 资源侧边栏：固定在最左侧，不参与横向滚动 */}
            {hasHierarchy ? (
              <ResourceSidebar
                resources={allResources}
                collapsedIds={collapsedResourceIds}
                onToggleCollapse={toggleCollapse}
                width={sidebarWidth}
              />
            ) : null}
            {/* 水平滚动容器：header + allday + time 统一滚动 */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                overflowX: 'auto',
                display: 'flex',
                flexDirection: 'row',
                minHeight: 0,
              }}
            >
              {/* 左侧 gutter 列：header 留白 + 全天留白 + 时间轴 sticky */}
              <div
                style={{
                  width: gutterWidth,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: SCHEDULER_HEADER_HEIGHT, flexShrink: 0 }} />
                {alldayEvents.length > 0 ? (
                  <div style={{ height: alldayPanelHeight, flexShrink: 0 }} />
                ) : null}
                <div
                  ref={gutterTimeRef}
                  style={{
                    flex: 1,
                    minHeight: 0,
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                    background: '#fff',
                    overflowY: 'hidden',
                  }}
                >
                  <TimeColumn
                    timeGridRows={timeGridData.rows}
                    nowIndicatorState={null}
                    width={gutterWidth}
                    style={{ height: '200%', minHeight: 900 }}
                  />
                </div>
              </div>
              {/* 内容列：header + allday + time，宽度由子元素撑开 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  minWidth: 0,
                }}
              >
                <div style={{ height: SCHEDULER_HEADER_HEIGHT, flexShrink: 0 }}>
                  <SchedulerHeader
                    weekDates={weekDates}
                    resources={resources}
                    timeGridLeftWidth={0}
                    scrollbarWidth={0}
                    columnWidth={columnWidth}
                  />
                </div>
                {alldayEvents.length > 0 ? (
                  <div style={{ height: alldayPanelHeight, flexShrink: 0 }}>
                    <SchedulerAllDayLane
                      uiModels={alldayEvents}
                      timeGridLeftWidth={0}
                      scrollbarWidth={0}
                      columnWidth={columnWidth}
                      gridPixelWidth={gridPixelWidth}
                    />
                  </div>
                ) : null}
                <div ref={timePanelRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <TimeGrid
                    timeGridData={timeGridData}
                    events={timeEvents}
                    columnWidth={columnWidth}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── 默认模式：Panel 系统驱动高度分配 ───
  return (
    <Layout className={cls('scheduler-view')}>
      <div className={cls('scheduler-scroll')}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0 }}>
            {/* 资源侧边栏 */}
            {hasHierarchy ? (
              <ResourceSidebar
                resources={allResources}
                collapsedIds={collapsedResourceIds}
                onToggleCollapse={toggleCollapse}
                width={sidebarWidth}
              />
            ) : null}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'row' }}>
              {/* 内容区：header + allday + time 三面板 */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                }}
              >
                <Panel name="scheduler-header" initialHeight={SCHEDULER_HEADER_HEIGHT}>
                  <SchedulerHeader
                    weekDates={weekDates}
                    resources={resources}
                    timeGridLeftWidth={gutterWidth}
                    scrollbarWidth={scrollbarWidth}
                  />
                </Panel>
                {alldayEvents.length > 0 ? (
                  <Panel name="allday" initialHeight={alldayPanelHeight}>
                    <SchedulerAllDayLane
                      uiModels={alldayEvents}
                      timeGridLeftWidth={gutterWidth}
                      scrollbarWidth={scrollbarWidth}
                    />
                  </Panel>
                ) : null}
                <Panel name="time" ref={timePanelRef}>
                  <div style={{ height: '100%' }}>
                    <TimeGrid timeGridData={timeGridData} events={timeEvents} />
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
