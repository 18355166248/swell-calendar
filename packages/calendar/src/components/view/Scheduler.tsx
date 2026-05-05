import { useCalendarStore } from '@/contexts/calendarStore';
import { cls } from '@/helpers/css';
import { getWeekDates } from '@/helpers/grid';
import { toEndOfDay, toStartOfDay } from '@/time/datetime';
import { useMemo } from 'react';
import { ResourceList } from '../timeline/ResourceList';
import { TimelineHeader } from '../timeline/TimelineHeader';
import { TimelineGrid } from '../timeline/TimelineGrid';

const RESOURCE_LIST_WIDTH = 150;
const ROW_HEIGHT = 56;
const CELL_WIDTH = 80; // px per hour

export function Scheduler() {
  const { options, calendar, view } = useCalendarStore();
  const { renderDate } = view;
  const schedulerOptions = options.scheduler;
  const weekOptions = options.week;

  const resources = schedulerOptions?.resources ?? [];
  const hourStart = schedulerOptions?.hourStart ?? weekOptions?.hourStart ?? 0;
  const hourEnd = schedulerOptions?.hourEnd ?? weekOptions?.hourEnd ?? 24;

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
        <p>暂无资源配置，请通过 scheduler.resources 传入资源列表</p>
      </div>
    );
  }

  const hoursPerDay = hourEnd - hourStart;
  const totalCells = weekDates.length * hoursPerDay;
  const gridWidth = totalCells * CELL_WIDTH;

  return (
    <div className={cls('scheduler')}>
      <div className={cls('scheduler-scroll')}>
        <div
          className={cls('scheduler-inner')}
          style={{ width: RESOURCE_LIST_WIDTH + gridWidth }}
        >
          <TimelineHeader
            weekDates={weekDates}
            hourStart={hourStart}
            hourEnd={hourEnd}
            resourceListWidth={RESOURCE_LIST_WIDTH}
            cellWidth={CELL_WIDTH}
          />
          <div className={cls('scheduler-body')}>
            <ResourceList resources={resources} rowHeight={ROW_HEIGHT} />
            <TimelineGrid
              resources={resources}
              calendar={calendar}
              weekDates={weekDates}
              weekStart={weekStart}
              weekEnd={weekEnd}
              hourStart={hourStart}
              hourEnd={hourEnd}
              rowHeight={ROW_HEIGHT}
              cellWidth={CELL_WIDTH}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
