import { useMemo } from 'react';

import { useCalendarStore } from '@/contexts/calendarStore';
import { cls } from '@/helpers/css';
import { getVisibleResources, getWeekDates } from '@/helpers/grid';
import { toEndOfDay, toStartOfDay } from '@/time/datetime';

import { ResourceList } from '../timeline/ResourceList';
import { TimelineGrid } from '../timeline/TimelineGrid';
import { TimelineHeader } from '../timeline/TimelineHeader';

const RESOURCE_LIST_WIDTH = 150;

export function Timeline() {
  const { options, calendar, view } = useCalendarStore();
  const { renderDate } = view;
  const timelineOptions = options.timeline;
  const schedulerOptions = options.scheduler;
  const weekOptions = options.week;

  // 资源池在 scheduler / timeline 间共享：timeline 未配置资源时回退到 scheduler.resources，
  // 避免从 scheduler 切到 timeline 视图时出现「暂无资源配置」。
  // 注意：选项归一化会给 timeline 填充默认 `resources: []`，因此不能只判 nullish，
  // 必须以「timeline 资源池为空」作为回退条件；并让 visibleResourceIds 跟随所选资源池。
  const timelineResources = timelineOptions?.resources;
  const timelineVisibleResourceIds = timelineOptions?.visibleResourceIds;
  const schedulerResources = schedulerOptions?.resources;
  const schedulerVisibleResourceIds = schedulerOptions?.visibleResourceIds;

  const resources = useMemo(() => {
    const useTimelinePool = (timelineResources?.length ?? 0) > 0;
    const resolvedResources = useTimelinePool ? timelineResources! : schedulerResources ?? [];
    const resolvedVisibleResourceIds = useTimelinePool
      ? timelineVisibleResourceIds
      : schedulerVisibleResourceIds;

    return getVisibleResources(resolvedResources, resolvedVisibleResourceIds);
  }, [
    timelineResources,
    timelineVisibleResourceIds,
    schedulerResources,
    schedulerVisibleResourceIds,
  ]);
  const hourStart = timelineOptions?.hourStart ?? weekOptions?.hourStart ?? 0;
  const hourEnd = timelineOptions?.hourEnd ?? weekOptions?.hourEnd ?? 24;
  const rowHeight = timelineOptions?.rowHeight ?? 56;
  const cellWidth = timelineOptions?.cellWidth ?? 80;

  const colors = timelineOptions?.colors ?? [];
  const invalid = timelineOptions?.invalid ?? timelineOptions?.blockedTimes ?? [];

  const weekDates = useMemo(
    () => getWeekDates(renderDate, weekOptions ?? {}),
    [renderDate, weekOptions]
  );

  const { weekStart, weekEnd } = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[weekDates.length - 1];

    return {
      weekStart: toStartOfDay(first),
      weekEnd: toEndOfDay(last),
    };
  }, [weekDates]);

  if (resources.length === 0) {
    return (
      <div className={cls('scheduler-empty')}>
        <p>暂无资源配置，请通过 timeline.resources（或 scheduler.resources）传入资源列表</p>
      </div>
    );
  }

  const hoursPerDay = hourEnd - hourStart;
  const totalCells = weekDates.length * hoursPerDay;
  const gridWidth = totalCells * cellWidth;

  return (
    <div className={cls('scheduler')}>
      <div className={cls('scheduler-scroll')}>
        <div className={cls('scheduler-inner')} style={{ width: RESOURCE_LIST_WIDTH + gridWidth }}>
          <TimelineHeader
            weekDates={weekDates}
            hourStart={hourStart}
            hourEnd={hourEnd}
            resourceListWidth={RESOURCE_LIST_WIDTH}
            cellWidth={cellWidth}
          />
          <div className={cls('scheduler-body')}>
            <ResourceList resources={resources} rowHeight={rowHeight} />
            <TimelineGrid
              resources={resources}
              calendar={calendar}
              weekDates={weekDates}
              weekStart={weekStart}
              weekEnd={weekEnd}
              hourStart={hourStart}
              hourEnd={hourEnd}
              rowHeight={rowHeight}
              cellWidth={cellWidth}
              colors={colors}
              invalid={invalid}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
