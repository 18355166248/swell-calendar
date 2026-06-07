import {
  TIMELINE_EVENT_GAP,
  TIMELINE_EVENT_HEIGHT,
  TIMELINE_ROW_PADDING_Y,
} from '@/constants/timeline-const';
import { CalendarTimelineRow } from '@/controller/timeline-calendar';
import { cls } from '@/helpers/css';
import { useTimelineCreate } from '@/hooks/Timeline/useTimelineCreate';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { TimelineEvent } from './TimelineEvent';

interface TimelineRowProps {
  row: CalendarTimelineRow;
  rowIndex: number;
  days: DayjsTZDate[];
  cellWidth: number;
  rowHeight: number;
  todayIndex: number;
  isWeekendDay: (day: DayjsTZDate) => boolean;
}

export function TimelineRow({
  row,
  rowIndex,
  days,
  cellWidth,
  rowHeight,
  todayIndex,
  isWeekendDay,
}: TimelineRowProps) {
  const onCreateStart = useTimelineCreate({ resourceIndex: rowIndex });

  return (
    <div
      className={cls('timeline-grid-row')}
      style={{ height: rowHeight }}
      onMouseDown={onCreateStart}
    >
      {/* 天列格（网格线 + 周末/今天浅染） */}
      {days.map((day, dayIndex) => (
        <div
          key={dayIndex}
          className={cls('timeline-grid-cell', {
            'timeline-grid-cell--weekend': isWeekendDay(day),
            'timeline-grid-cell--today': dayIndex === todayIndex,
          })}
          style={{ width: cellWidth }}
        />
      ))}

      {/* 事件横条 */}
      {row.items.map((item) => {
        const left = item.startDayIndex * cellWidth + 1;
        const width = (item.endDayIndex - item.startDayIndex + 1) * cellWidth - 2;
        const top =
          TIMELINE_ROW_PADDING_Y + item.lane * (TIMELINE_EVENT_HEIGHT + TIMELINE_EVENT_GAP);

        return (
          <TimelineEvent
            key={item.uiModel.cid()}
            uiModel={item.uiModel}
            resourceIndex={rowIndex}
            startDayIndex={item.startDayIndex}
            endDayIndex={item.endDayIndex}
            left={left}
            width={width}
            top={top}
            height={TIMELINE_EVENT_HEIGHT}
            exceedLeft={item.exceedLeft}
            exceedRight={item.exceedRight}
          />
        );
      })}
    </div>
  );
}
