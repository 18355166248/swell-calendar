import {
  TIMELINE_EVENT_GAP,
  TIMELINE_EVENT_HEIGHT,
  TIMELINE_ROW_PADDING_Y,
} from '@/constants/timeline-const';
import { CalendarTimelineRow } from '@/controller/timeline-calendar';
import { cls } from '@/helpers/css';
import { isWeekend } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { TimelineEvent } from './TimelineEvent';

interface TimelineGridProps {
  rows: CalendarTimelineRow[];
  days: DayjsTZDate[];
  rowHeights: number[];
  cellWidth: number;
  todayIndex: number;
}

/**
 * Calendar Timeline 网格：资源行 × 天列，事件渲染为跨天横条（按车道纵向堆叠）。
 */
export function TimelineGrid({ rows, days, rowHeights, cellWidth, todayIndex }: TimelineGridProps) {
  const totalWidth = days.length * cellWidth;

  return (
    <div className={cls('timeline-grid')} style={{ width: totalWidth }}>
      {rows.map((row, rowIndex) => (
        <div
          key={row.resourceId}
          className={cls('timeline-grid-row')}
          style={{ height: rowHeights[rowIndex] }}
        >
          {/* 天列格（网格线 + 周末/今天浅染） */}
          {days.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={cls('timeline-grid-cell', {
                'timeline-grid-cell--weekend': isWeekend(day.dayjs.day()),
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
      ))}
    </div>
  );
}
