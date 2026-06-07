import { cls } from '@/helpers/css';
import { isWeekend } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

interface TimelineHeaderProps {
  days: DayjsTZDate[];
  cellWidth: number;
  resourceListWidth: number;
  monthLabel: string;
  todayIndex: number;
}

/**
 * Calendar Timeline 双层表头：
 * - 上层：月份标签，横跨所有天列
 * - 下层：每个天列显示「周X」+ 日号，周末浅染、今天高亮
 */
export function TimelineHeader({
  days,
  cellWidth,
  resourceListWidth,
  monthLabel,
  todayIndex,
}: TimelineHeaderProps) {
  const totalWidth = days.length * cellWidth;

  return (
    <div className={cls('timeline-header')}>
      <div className={cls('timeline-header-placeholder')} style={{ width: resourceListWidth }} />
      <div className={cls('timeline-header-cells')} style={{ width: totalWidth }}>
        <div className={cls('timeline-header-month')}>{monthLabel}</div>
        <div className={cls('timeline-header-days')}>
          {days.map((day, index) => {
            const weekend = isWeekend(day.dayjs.day());
            const isToday = index === todayIndex;
            return (
              <div
                key={index}
                className={cls('timeline-header-day', {
                  'timeline-header-day--weekend': weekend,
                  'timeline-header-day--today': isToday,
                })}
                style={{ width: cellWidth }}
              >
                <span className={cls('timeline-header-weekday')}>{DAY_NAMES[day.dayjs.day()]}</span>
                <span className={cls('timeline-header-date')}>{day.dayjs.date()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
