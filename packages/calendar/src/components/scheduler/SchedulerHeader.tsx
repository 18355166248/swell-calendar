import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { ResourceInfo } from '@/types/options.type';

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
      }}
    >
      <div className={cls('scheduler-header-date-row')}>
        {weekDates.map((date) => {
          const month = date.dayjs.month() + 1;
          const day = date.dayjs.date();
          const weekday = DAY_NAMES[date.dayjs.day()];

          return (
            <div
              key={date.toString()}
              className={cls('scheduler-header-day-label')}
              style={{ flex: `0 0 ${dayWidthPct}` }}
            >
              {month}/{day} 周{weekday}
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
                borderRight:
                  resIdx === resources.length - 1
                    ? '1px solid #e8e8e8'
                    : '1px solid #f0f0f0',
              }}
            >
              <span
                className={cls('scheduler-header-resource-dot')}
                style={{
                  backgroundColor: resource.backgroundColor || resource.color || '#3b82f6',
                }}
              />
              <span className={cls('scheduler-header-resource-name')}>{resource.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
