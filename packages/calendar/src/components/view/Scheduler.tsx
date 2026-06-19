import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { WEEK_DAY_NAME_BORDER, WEEK_DAY_NAME_HEIGHT } from '@/constants/style.const';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import { useThemeStore } from '@/contexts/themeStore';
import { getSchedulerViewEvents } from '@/controller/scheduler-layout';
import {
  computeNextVisibleResourceIds,
  flattenResourceTree,
  getFlattenedVisibleResources,
  normalizeResources,
} from '@/controller/scheduler-resources';
import { cls } from '@/helpers/css';
import { createSchedulerTimeGridData, getWeekDates } from '@/helpers/grid';
import useTimeGridScrollSync from '@/hooks/TimeGrid/useTimeGridScrollSync';
import { toEndOfDay, toStartOfDay } from '@/time/datetime';

import Layout from '../Layout';
import Panel from '../Panel';
import { HiddenResourcesControl } from '../scheduler/HiddenResourcesControl';
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
  const { timeGridLeft, allday: alldayTheme } = useThemeStore((state) => state.week);
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

  // 资源显隐受控回调：派发意图，由宿主回写 visibleResourceIds
  const callbacks = useCalendarCallbacks();
  const onResourceVisibilityChange = callbacks?.onResourceVisibilityChange;

  const handleToggleVisibility = useCallback(
    (resourceId: string) => {
      const next = computeNextVisibleResourceIds(
        schedulerOptions?.resources ?? [],
        schedulerOptions?.visibleResourceIds,
        resourceId
      );
      onResourceVisibilityChange?.({
        resourceId,
        visible: next.includes(resourceId),
        visibleResourceIds: next,
      });
    },
    [schedulerOptions?.resources, schedulerOptions?.visibleResourceIds, onResourceVisibilityChange]
  );

  const toggleVisibility = onResourceVisibilityChange ? handleToggleVisibility : undefined;

  // 被「显隐」隐藏的资源（不含因折叠而暂时不可见的子资源），用于头部恢复入口
  const hiddenResources = useMemo(() => {
    if (!onResourceVisibilityChange) {
      return [];
    }
    const visibleByVisibility = new Set(
      getFlattenedVisibleResources(
        schedulerOptions?.resources ?? [],
        schedulerOptions?.visibleResourceIds
      ).map((r) => r.id)
    );
    return Array.from(flattenResourceTree(allResources).values()).filter(
      (r) => !visibleByVisibility.has(r.id)
    );
  }, [
    onResourceVisibilityChange,
    schedulerOptions?.resources,
    schedulerOptions?.visibleResourceIds,
    allResources,
  ]);

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
                <div style={{ height: SCHEDULER_HEADER_HEIGHT, flexShrink: 0 }}>
                  {toggleVisibility ? (
                    <HiddenResourcesControl
                      hiddenResources={hiddenResources}
                      onShow={handleToggleVisibility}
                      width={gutterWidth}
                    />
                  ) : null}
                </div>
                {alldayEvents.length > 0 ? (
                  // 固定列宽模式：内容列的全天事件需从 x=0 起与日期列对齐，
                  // 因此「全天」标签放在 gutter 列里，由 SchedulerAllDayLane 关闭自带标签。
                  <div
                    className={cls('scheduler-allday-lane-label')}
                    style={{
                      height: alldayPanelHeight,
                      flexShrink: 0,
                      color: alldayTheme.labelColor,
                      borderRight: alldayTheme.labelBorderRight,
                      background: alldayTheme.backgroundColor,
                    }}
                  >
                    全天
                  </div>
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
                    onToggleVisibility={toggleVisibility}
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
                    hideGutter
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
      {/*
        Layout 根节点是 display:block，.scheduler-scroll 的 flex:1 不会生效，
        需显式 height:100% 才能撑满，否则内部 height:100% 链塌缩到内容高度、
        time 区域无法铺满。固定列宽分支同样在此处显式给了 height:100%。
      */}
      <div className={cls('scheduler-scroll')} style={{ height: '100%' }}>
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
                  <div style={{ position: 'relative', height: '100%' }}>
                    <SchedulerHeader
                      weekDates={weekDates}
                      resources={resources}
                      timeGridLeftWidth={gutterWidth}
                      scrollbarWidth={scrollbarWidth}
                      onToggleVisibility={toggleVisibility}
                    />
                    {toggleVisibility ? (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: gutterWidth,
                        }}
                      >
                        <HiddenResourcesControl
                          hiddenResources={hiddenResources}
                          onShow={handleToggleVisibility}
                          width={gutterWidth}
                        />
                      </div>
                    ) : null}
                  </div>
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
                {/*
                  时间网格用 flex 填充剩余高度，而非依赖 Panel 的「最后面板吃满」机制：
                  Layout 只识别其直接子节点中的 Panel，而 scheduler 的 Panel 嵌在
                  scheduler-scroll / sidebar 等包裹层内，最后面板探测失效，time 面板会退回
                  默认 72px。固定列宽分支同理用 flex:1 处理。
                */}
                <div ref={timePanelRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <TimeGrid timeGridData={timeGridData} events={timeEvents} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
