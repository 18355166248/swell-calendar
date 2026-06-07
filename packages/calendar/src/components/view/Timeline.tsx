import { useMemo } from 'react';

import {
  getTimelineRowHeight,
  TIMELINE_DAY_CELL_WIDTH,
  TIMELINE_RESOURCE_LIST_WIDTH,
} from '@/constants/timeline-const';
import { useCalendarStore } from '@/contexts/calendarStore';
import { getCalendarTimelineDays, getCalendarTimelineRow } from '@/controller/timeline-calendar';
import { cls } from '@/helpers/css';
import { getVisibleResources } from '@/helpers/grid';
import { isSameDate } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { ResourceList } from '../timeline/ResourceList';
import { TimelineGrid } from '../timeline/TimelineGrid';
import { TimelineHeader } from '../timeline/TimelineHeader';

export function Timeline() {
  const { options, calendar, view } = useCalendarStore();
  const { renderDate } = view;
  const timelineOptions = options.timeline;
  const schedulerOptions = options.scheduler;

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

  const cellWidth = timelineOptions?.cellWidth ?? TIMELINE_DAY_CELL_WIDTH;
  const resourceListWidth = TIMELINE_RESOURCE_LIST_WIDTH;

  // 日粒度时间轴：renderDate 所在自然月的每一天作为列
  const days = useMemo(() => getCalendarTimelineDays(renderDate), [renderDate]);

  // 每个资源行的事件布局（含车道数）
  const rows = useMemo(
    () => resources.map((resource) => getCalendarTimelineRow(calendar, resource.id, days)),
    [resources, calendar, days]
  );

  const rowHeights = useMemo(() => rows.map((row) => getTimelineRowHeight(row.laneCount)), [rows]);

  const todayIndex = useMemo(() => {
    const now = new DayjsTZDate().local();
    return days.findIndex((day) => isSameDate(day, now));
  }, [days]);

  const monthLabel = useMemo(() => {
    const d = renderDate.dayjs;
    return `${d.year()}年${d.month() + 1}月`;
  }, [renderDate]);

  if (resources.length === 0) {
    return (
      <div className={cls('scheduler-empty')}>
        <p>暂无资源配置，请通过 timeline.resources（或 scheduler.resources）传入资源列表</p>
      </div>
    );
  }

  const gridWidth = days.length * cellWidth;

  return (
    <div className={cls('scheduler')}>
      <div className={cls('scheduler-scroll')}>
        <div className={cls('scheduler-inner')} style={{ width: resourceListWidth + gridWidth }}>
          <TimelineHeader
            days={days}
            cellWidth={cellWidth}
            resourceListWidth={resourceListWidth}
            monthLabel={monthLabel}
            todayIndex={todayIndex}
          />
          <div className={cls('scheduler-body')}>
            <ResourceList resources={resources} rowHeights={rowHeights} />
            <TimelineGrid
              rows={rows}
              days={days}
              rowHeights={rowHeights}
              cellWidth={cellWidth}
              todayIndex={todayIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
