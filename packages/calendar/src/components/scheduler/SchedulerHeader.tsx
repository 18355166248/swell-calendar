import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { ResourceInfo } from '@/types/options.type';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

interface SchedulerHeaderProps {
  weekDates: DayjsTZDate[];
  resources: ResourceInfo[];
  timeGridLeftWidth: number | string;
}

export function SchedulerHeader({
  weekDates,
  resources,
  timeGridLeftWidth,
}: SchedulerHeaderProps) {
  return (
    <div className={cls('scheduler-header')} style={{ marginLeft: timeGridLeftWidth }}>
      {weekDates.map((date) => {
        const month = date.dayjs.month() + 1;
        const day = date.dayjs.date();
        const weekday = DAY_NAMES[date.dayjs.day()];

        return (
          <div key={date.toString()} className={cls('scheduler-header-day-group')}>
            <div className={cls('scheduler-header-day-label')}>
              {month}/{day} 周{weekday}
            </div>
            <div className={cls('scheduler-header-resource-row')}>
              {resources.map((resource) => (
                <div
                  key={`${date.toString()}-${resource.id}`}
                  className={cls('scheduler-header-resource-cell')}
                >
                  <span
                    className={cls('scheduler-header-resource-dot')}
                    style={{
                      backgroundColor: resource.backgroundColor || resource.color || '#3b82f6',
                    }}
                  />
                  <span className={cls('scheduler-header-resource-name')}>{resource.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
