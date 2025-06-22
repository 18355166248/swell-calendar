import { useThemeStore } from '@/contexts/themeStore';
import { addTimeGridPrefix } from '@/constants/timeGrid-const';
import { TimeGridRow } from '@/types/grid.type';
import { memo, useCallback, useMemo } from 'react';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { cls, toPercent } from '@/helpers/css';
import { addMinutes, setTimeStrToDate } from '@/time/datetime';
import { Template } from '../Template';
import { isNil } from 'lodash-es';
import NowIndicatorLabel from './NowIndicatorLabel';

type NowIndicatorState = {
  top: number;
  now: DayjsTZDate;
} | null;

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
  }[];
  width: number;
  isPrimary?: boolean;
  nowIndicatorState: NowIndicatorState;
}

function HourRows({ rowsInfo, width, isPrimary = false, nowIndicatorState }: HourRowsProps) {
  const zoneNow = !isNil(nowIndicatorState) ? addMinutes(nowIndicatorState.now, 0) : null;
  const { pastTime, futureTime, showNowIndicator } = useThemeStore().week;

  return (
    <div role="rowgroup" className={classNames.hourRows} style={{ width: toPercent(width) }}>
      {rowsInfo.map(({ date, top, className }) => {
        const isPast = !isNil(zoneNow) && date.isBefore(zoneNow);

        return (
          <div
            key={date.getTime()}
            className={className}
            style={{
              top: toPercent(top),
              color: isPast ? pastTime.color : futureTime.color,
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
      {showNowIndicator && !isNil(nowIndicatorState) && !isNil(zoneNow) && (
        <NowIndicatorLabel
          unit="hour"
          top={nowIndicatorState.top}
          now={nowIndicatorState.now}
          zonedNow={zoneNow}
        />
      )}
    </div>
  );
}

interface TimeColumnProps {
  timeGridRows: TimeGridRow[];
  nowIndicatorState: NowIndicatorState;
}

function TimeColumn({ timeGridRows, nowIndicatorState }: TimeColumnProps) {
  const { week } = useThemeStore();
  const { timeGridLeft, showNowIndicator } = week;
  const { width } = timeGridLeft;

  const rowsByHour = useMemo(
    () => timeGridRows.filter((_, index) => index % 2 === 0 || index === timeGridRows.length - 1),
    [timeGridRows]
  );

  const hourRowsPropsMapper = useCallback(
    (row: TimeGridRow, index: number) => {
      const showHide = () => {
        if (!showNowIndicator || isNil(nowIndicatorState)) {
          return false;
        }
        const indicatorTop = nowIndicatorState.top;
        const rowTop = row.top;
        const rowHeight = row.height;
        return rowTop - rowHeight <= indicatorTop && indicatorTop <= rowTop + rowHeight;
      };
      const isFirst = index === 0;
      const isLast = index === rowsByHour.length - 1;
      const isHidden = showHide();
      const className = cls(classNames.time, {
        [classNames.first]: isFirst,
        [classNames.last]: isLast,
        [classNames.hidden]: isHidden,
      });
      const date = setTimeStrToDate(new DayjsTZDate(), isLast ? row.endTime : row.startTime);

      return {
        date,
        top: row.top,
        className,
      };
    },
    [rowsByHour, nowIndicatorState]
  );

  const primaryTimezoneHourRowsProps = rowsByHour.map((row, index) =>
    hourRowsPropsMapper(row, index)
  );

  return (
    <div className={classNames.timeColumn} style={{ width }}>
      <HourRows
        rowsInfo={primaryTimezoneHourRowsProps}
        width={100}
        nowIndicatorState={nowIndicatorState}
      />
    </div>
  );
}

export default memo(TimeColumn);
