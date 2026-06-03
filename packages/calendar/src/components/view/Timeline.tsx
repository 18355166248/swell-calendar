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
  const weekOptions = options.week;

  const resources = useMemo(
    () => getVisibleResources(timelineOptions?.resources ?? []),
    [timelineOptions?.resources]
  );
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
        <p>暂无资源配置，请通过 timeline.resources 传入资源列表</p>
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
