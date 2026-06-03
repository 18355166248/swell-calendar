import { useMemo } from 'react';

import { getTimelineEvents } from '@/controller/timeline.controller';
import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { ResourceInfo } from '@/types/options.type';

import { TimelineEvent } from './TimelineEvent';

interface TimelineGridProps {
  resources: ResourceInfo[];
  calendar: CalendarData;
  weekDates: DayjsTZDate[];
  weekStart: DayjsTZDate;
  weekEnd: DayjsTZDate;
  hourStart: number;
  hourEnd: number;
  rowHeight: number;
  cellWidth: number;
}

export function TimelineGrid({
  resources,
  calendar,
  weekDates,
  weekStart,
  weekEnd,
  hourStart,
  hourEnd,
  rowHeight,
  cellWidth,
}: TimelineGridProps) {
  const hoursPerDay = hourEnd - hourStart;

  const resourceEvents = useMemo(
    () =>
      resources.map((resource) =>
        getTimelineEvents(calendar, resource.id, weekStart, weekEnd, hourStart, hourEnd)
      ),
    [resources, calendar, weekStart, weekEnd, hourStart, hourEnd]
  );

  const totalWidth = weekDates.length * hoursPerDay * cellWidth;

  return (
    <div className={cls('timeline-grid')} style={{ width: totalWidth }}>
      {resources.map((resource, rowIndex) => (
        <div key={resource.id} className={cls('timeline-grid-row')} style={{ height: rowHeight }}>
          {weekDates.map((_, dayIndex) =>
            Array.from({ length: hoursPerDay }, (__, h) => {
              const cellIndex = dayIndex * hoursPerDay + h;
              const isLastInDay = h === hoursPerDay - 1;
              return (
                <div
                  key={cellIndex}
                  className={cls('timeline-grid-cell', {
                    'timeline-grid-cell--day-end': isLastInDay,
                  })}
                  style={{ width: cellWidth }}
                />
              );
            })
          )}
          {resourceEvents[rowIndex].map((uiModel) => (
            <TimelineEvent key={uiModel.cid()} uiModel={uiModel} totalWidth={totalWidth} />
          ))}
        </div>
      ))}
    </div>
  );
}
