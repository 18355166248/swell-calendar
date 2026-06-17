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
  /** 固定列宽（像素），设置后使用像素宽度而非百分比 */
  columnWidth?: number;
}

export function SchedulerHeader({
  weekDates,
  resources,
  timeGridLeftWidth,
  scrollbarWidth = 0,
  columnWidth,
}: SchedulerHeaderProps) {
  const schedulerHeaderTheme = useThemeStore((state) => state.timeline.schedulerHeader);
  const schedulerResourceCellTheme = useThemeStore((state) => state.timeline.schedulerResourceCell);
  const totalCols = weekDates.length * resources.length;
  // 固定列宽模式：天标签 = columnWidth × 资源数 px；资源单元格 = columnWidth px
  // 百分比模式：天标签 = 100/天数 %；资源单元格 = 100/总列数 %
  const dayWidth = columnWidth
    ? `${columnWidth * resources.length}px`
    : `${100 / weekDates.length}%`;
  const colWidth = columnWidth ? `${columnWidth}px` : `${100 / totalCols}%`;
  const rightOffset = !columnWidth && scrollbarWidth > 0 ? ` - ${scrollbarWidth}px` : '';

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
          const isToday = date.dayjs.isSame(new DayjsTZDate().dayjs, 'day');

          return (
            <div
              key={date.toString()}
              className={cls('scheduler-header-day-label', {
                'scheduler-header-day-label-today': isToday,
              })}
              style={{
                flex: `0 0 ${dayWidth}`,
                color: isToday ? undefined : schedulerHeaderTheme.dayLabelColor,
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
                  isToday,
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
                flex: `0 0 ${colWidth}`,
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
