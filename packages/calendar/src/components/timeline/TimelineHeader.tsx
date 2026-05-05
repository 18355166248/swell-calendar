import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

interface TimelineHeaderProps {
  weekDates: DayjsTZDate[];
  hourStart: number;
  hourEnd: number;
  resourceListWidth: number;
  cellWidth: number;
}

export function TimelineHeader({
  weekDates,
  hourStart,
  hourEnd,
  resourceListWidth,
  cellWidth,
}: TimelineHeaderProps) {
  const cells: { label: string; dateLabel?: string }[] = [];

  weekDates.forEach((date) => {
    const month = date.dayjs.month() + 1;
    const day = date.dayjs.date();
    const weekday = DAY_NAMES[date.dayjs.day()];

    for (let h = hourStart; h < hourEnd; h++) {
      cells.push({
        label: `${String(h).padStart(2, '0')}:00`,
        dateLabel: h === hourStart ? `${month}/${day} 周${weekday}` : undefined,
      });
    }
  });

  return (
    <div className={cls('timeline-header')}>
      <div
        className={cls('timeline-header-placeholder')}
        style={{ width: resourceListWidth }}
      />
      <div className={cls('timeline-header-cells')}>
        {cells.map((cell, index) => (
          <div
            key={index}
            className={cls('timeline-header-cell')}
            style={{ width: cellWidth }}
          >
            {cell.dateLabel ? (
              <span className={cls('timeline-header-date')}>{cell.dateLabel}</span>
            ) : null}
            <span className={cls('timeline-header-hour')}>{cell.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
