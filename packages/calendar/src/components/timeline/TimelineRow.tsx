import {
  TIMELINE_EVENT_GAP,
  TIMELINE_EVENT_HEIGHT,
  TIMELINE_ROW_PADDING_Y,
} from '@/constants/timeline-const';
import { useThemeStore } from '@/contexts/themeStore';
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

function getCellBackground({
  weekend,
  isToday,
  weekendBackgroundColor,
  todayBackgroundColor,
}: {
  weekend: boolean;
  isToday: boolean;
  weekendBackgroundColor: string;
  todayBackgroundColor: string;
}) {
  const hasTodayHighlight =
    todayBackgroundColor !== '' &&
    todayBackgroundColor !== 'transparent' &&
    todayBackgroundColor !== 'inherit';

  if (isToday && hasTodayHighlight) {
    return todayBackgroundColor;
  }

  if (weekend) {
    return weekendBackgroundColor;
  }

  return undefined;
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
  const gridTheme = useThemeStore((s) => s.timeline.grid);

  return (
    <div
      className={cls('timeline-grid-row')}
      style={{ height: rowHeight, borderBottom: gridTheme.rowBorderBottom }}
      onPointerDown={onCreateStart}
    >
      {/* 天列格（网格线 + 周末/今天浅染） */}
      {days.map((day, dayIndex) => {
        const weekend = isWeekendDay(day);
        const isToday = dayIndex === todayIndex;
        return (
          <div
            key={dayIndex}
            className={cls('timeline-grid-cell', {
              'timeline-grid-cell--weekend': weekend,
              'timeline-grid-cell--today': isToday,
            })}
            style={{
              width: cellWidth,
              borderRight: gridTheme.cellBorderRight,
              background: getCellBackground({
                weekend,
                isToday,
                weekendBackgroundColor: gridTheme.weekendBackgroundColor,
                todayBackgroundColor: gridTheme.todayBackgroundColor,
              }),
            }}
          />
        );
      })}

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
