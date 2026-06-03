import { MonthWeekEventData } from '@/controller/month.controller';
import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { MonthEvent } from './MonthEvent';

const CELL_EVENT_HEIGHT = 22;
const CELL_HEADER_HEIGHT = 28;

interface MonthGridProps {
  weeks: DayjsTZDate[][];
  eventRows: MonthWeekEventData[];
  renderDate: DayjsTZDate;
  visibleEventCount: number;
}

function isSameDay(a: DayjsTZDate, b: DayjsTZDate) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: DayjsTZDate) {
  return isSameDay(date, new DayjsTZDate());
}

function isCurrentMonth(date: DayjsTZDate, renderDate: DayjsTZDate) {
  return (
    date.getFullYear() === renderDate.getFullYear() && date.getMonth() === renderDate.getMonth()
  );
}

export function MonthGrid({ weeks, eventRows, renderDate, visibleEventCount }: MonthGridProps) {
  const weekCount = weeks.length;
  const rowHeightPercent = 100 / weekCount;

  return (
    <div className={cls('month-grid')}>
      {weeks.map((week, weekIndex) => {
        const { rows, overflowByCol } = eventRows[weekIndex] ?? { rows: [], overflowByCol: [] };

        return (
          <div
            key={weekIndex}
            className={cls('month-week-row')}
            style={{ height: `${rowHeightPercent}%` }}
          >
            {week.map((date, colIndex) => {
              const today = isToday(date);
              const currentMonth = isCurrentMonth(date, renderDate);
              const overflow = overflowByCol[colIndex] ?? 0;

              return (
                <div
                  key={colIndex}
                  className={cls('month-cell', {
                    'month-cell-today': today,
                    'month-cell-other-month': !currentMonth,
                  })}
                >
                  <div className={cls('month-cell-header')}>
                    <span className={cls('month-cell-date', { 'month-cell-date-today': today })}>
                      {date.getDate()}
                    </span>
                  </div>
                  {overflow > 0 && (
                    <div
                      className={cls('month-more')}
                      style={{ top: CELL_HEADER_HEIGHT + visibleEventCount * CELL_EVENT_HEIGHT }}
                    >
                      +{overflow} 更多
                    </div>
                  )}
                </div>
              );
            })}

            <div className={cls('month-event-layer')}>
              {rows.map(({ uiModel, startCol, colspan, slotIndex }, i) => (
                <MonthEvent
                  key={i}
                  uiModel={uiModel}
                  startCol={startCol}
                  colspan={colspan}
                  slotIndex={slotIndex}
                  cellEventHeight={CELL_EVENT_HEIGHT}
                  cellHeaderHeight={CELL_HEADER_HEIGHT}
                  totalCols={7}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
