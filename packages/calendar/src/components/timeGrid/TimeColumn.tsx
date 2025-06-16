import { useThemeStore } from '@/contexts/themeStore';
import { addTimeGridPrefix } from '@/constants/timeGrid-const';
import { TimeGridRow } from '@/types/grid.type';
import { memo, useCallback, useMemo } from 'react';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { cls, toPercent } from '@/helpers/css';
import { setTimeStrToDate } from '@/time/datetime';
import { Template } from '../Template';

const classNames = {
  timeColumn: cls(addTimeGridPrefix('time-column')),
  hourRows: cls(addTimeGridPrefix('hour-rows')),
  time: addTimeGridPrefix('time'),
  timeLabel: cls(addTimeGridPrefix('time-label')),
  first: addTimeGridPrefix('time-first'),
  last: addTimeGridPrefix('time-last'),
  hidden: addTimeGridPrefix('time-hidden'),
};

interface HourRowsProps {
  rowsInfo: {
    date: DayjsTZDate;
    top: number;
    className: string;
    diffFromPrimaryTimezone?: number;
  }[];
  width: number;
  isPrimary?: boolean;
}

function HourRows({ rowsInfo, width, isPrimary = false }: HourRowsProps) {
  return (
    <div role="rowgroup" className={classNames.hourRows} style={{ width: toPercent(width) }}>
      {rowsInfo.map(({ date, top, className }) => {
        // const isPast = !isN
        return (
          <div
            key={date.getTime()}
            className={className}
            style={{
              top: toPercent(top),
            }}
            role="row"
          >
            <Template
              template={`timeGridDisplay${isPrimary ? 'Primary' : ''}Time`}
              param={{ time: date }}
              as="span"
            />
          </div>
        );
      })}
    </div>
  );
}

interface TimeColumnProps {
  timeGridRows: TimeGridRow[];
}

function TimeColumn({ timeGridRows }: TimeColumnProps) {
  const { week } = useThemeStore();
  const { timeGridLeft } = week;
  const { width } = timeGridLeft;

  const rowsByHour = useMemo(
    () => timeGridRows.filter((_, index) => index % 2 === 0 || index === timeGridRows.length - 1),
    [timeGridRows]
  );
  console.log('🚀 ~ TimeColumn ~ rowsByHour:', rowsByHour);
  const hourRowsPropsMapper = useCallback(
    (row: TimeGridRow, index: number) => {
      const isFirst = index === 0;
      const isLast = index === rowsByHour.length - 1;
      const className = cls(classNames.time, {
        [classNames.first]: isFirst,
        [classNames.last]: isLast,
      });
      const date = setTimeStrToDate(new DayjsTZDate(), isLast ? row.endTime : row.startTime);

      return {
        date,
        top: row.top,
        className,
      };
    },
    [rowsByHour]
  );

  const primaryTimezoneHourRowsProps = rowsByHour.map((row, index) =>
    hourRowsPropsMapper(row, index)
  );

  return (
    <div className={classNames.timeColumn} style={{ width }}>
      <HourRows rowsInfo={primaryTimezoneHourRowsProps} width={100} />
    </div>
  );
}

export default memo(TimeColumn);
