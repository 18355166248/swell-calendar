import { useThemeStore } from '@/contexts/themeStore';
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
  const theme = useThemeStore((s) => s.timeline.header);
  const totalWidth = days.length * cellWidth;

  return (
    <div
      className={cls('timeline-header')}
      style={{ borderBottom: theme.borderBottom, background: theme.backgroundColor }}
    >
      <div
        className={cls('timeline-header-placeholder')}
        style={{
          width: resourceListWidth,
          borderRight: theme.borderBottom, // 同色边框
          background: theme.placeholderBackgroundColor,
        }}
      />
      <div className={cls('timeline-header-cells')} style={{ width: totalWidth }}>
        <div
          className={cls('timeline-header-month')}
          style={{
            color: theme.monthColor,
            background: theme.monthBackgroundColor,
            borderBottom: theme.monthBorderBottom,
          }}
        >
          {monthLabel}
        </div>
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
                style={{
                  width: cellWidth,
                  borderRight: theme.dayBorderRight,
                  ...(weekend ? { background: theme.weekendBackgroundColor } : {}),
                  ...(isToday ? { background: theme.todayBackgroundColor } : {}),
                }}
              >
                <span
                  className={cls('timeline-header-weekday')}
                  style={{ color: theme.weekdayColor }}
                >
                  {DAY_NAMES[day.dayjs.day()]}
                </span>
                <span
                  className={cls('timeline-header-date')}
                  style={{ color: isToday ? theme.todayColor : theme.dateColor }}
                >
                  {day.dayjs.date()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
