import { useThemeStore } from '@/contexts/themeStore';
import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { ResourceInfo } from '@/types/options.type';

import { Template } from '../Template';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

interface SchedulerHeaderProps {
  weekDates: DayjsTZDate[];
  resources: ResourceInfo[];
  timeGridLeftWidth: number | string;
  scrollbarWidth?: number;
}

export function SchedulerHeader({
  weekDates,
  resources,
  timeGridLeftWidth,
  scrollbarWidth = 0,
}: SchedulerHeaderProps) {
  const schedulerHeaderTheme = useThemeStore((state) => state.timeline.schedulerHeader);
  const schedulerResourceCellTheme = useThemeStore((state) => state.timeline.schedulerResourceCell);
  const totalCols = weekDates.length * resources.length;
  const dayWidthPct = `${100 / weekDates.length}%`;
  const colWidthPct = `${100 / totalCols}%`;
  const rightOffset = scrollbarWidth > 0 ? ` - ${scrollbarWidth}px` : '';

  return (
    <div
      className={cls('scheduler-header')}
      style={{
        marginLeft: timeGridLeftWidth,
        width: `calc(100% - ${timeGridLeftWidth}${rightOffset})`,
        minWidth: 0,
        background: schedulerHeaderTheme.backgroundColor,
        borderBottom: schedulerHeaderTheme.borderBottom,
      }}
    >
      <div
        className={cls('scheduler-header-date-row')}
        style={{
          background: schedulerHeaderTheme.dateRowBackgroundColor,
          borderBottom: schedulerHeaderTheme.dateRowBorderBottom,
        }}
      >
        {weekDates.map((date) => {
          const month = date.dayjs.month() + 1;
          const day = date.dayjs.date();

          return (
            <div
              key={date.toString()}
              className={cls('scheduler-header-day-label')}
              style={{
                flex: `0 0 ${dayWidthPct}`,
                color: schedulerHeaderTheme.dayLabelColor,
                borderRight: schedulerHeaderTheme.dayLabelBorderRight,
              }}
            >
              <Template
                template="schedulerDayHeader"
                as="span"
                param={{
                  date: day,
                  day: date.dayjs.day(),
                  dayName: DAY_NAMES[date.dayjs.day()],
                  month,
                  isToday: date.dayjs.isSame(new DayjsTZDate().dayjs, 'day'),
                  dateInstance: date,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className={cls('scheduler-header-resource-row')}>
        {weekDates.map((date, dayIdx) =>
          resources.map((resource, resIdx) => (
            <div
              key={`${date.toString()}-${resource.id}`}
              className={cls('scheduler-header-resource-cell')}
              style={{
                flex: `0 0 ${colWidthPct}`,
                color: schedulerResourceCellTheme.nameColor,
                borderRight:
                  resIdx === resources.length - 1
                    ? schedulerHeaderTheme.dayLabelBorderRight
                    : schedulerHeaderTheme.dateRowBorderBottom,
              }}
            >
              <Template
                template="schedulerResourceHeader"
                as="span"
                param={{
                  resourceId: resource.id,
                  resourceName: resource.name,
                  resourceColor: resource.color,
                  resourceBackgroundColor: resource.backgroundColor,
                  resourceMeta: resource.meta,
                  dateInstance: date,
                  dateIndex: dayIdx,
                  resourceIndex: resIdx,
                  isLastResourceOfDay: resIdx === resources.length - 1,
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
