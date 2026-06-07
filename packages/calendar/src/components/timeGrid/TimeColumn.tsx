import { isNil } from 'lodash-es';
import { memo, useCallback, useMemo } from 'react';

import { addTimeGridPrefix } from '@/constants/timeGrid-const';
import { useThemeStore } from '@/contexts/themeStore';
import { cls, toPercent } from '@/helpers/css';
import { addMinutes, setTimeStrToDate } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { convertTimezone } from '@/time/timezone';
import { TimeGridRow } from '@/types/grid.type';
import { SchedulerTimezone } from '@/types/options.type';

import { Template } from '../Template';
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
  /** 是否在本轴渲染当前时间刻度标签（仅主轴为 true） */
  showNowLabel?: boolean;
  /** 副轴时区；提供时将每行的刻度从 sourceTimezone 转换到该时区显示 */
  targetTimezone?: string;
  /** 主显示时区（网格墙钟所属时区），用作副轴转换的源时区 */
  sourceTimezone?: string;
  /** 轴顶部标签 */
  displayLabel?: string;
}

function HourRows({
  rowsInfo,
  width,
  isPrimary = false,
  nowIndicatorState,
  showNowLabel = false,
  targetTimezone,
  sourceTimezone,
  displayLabel,
}: HourRowsProps) {
  const zoneNow = !isNil(nowIndicatorState) ? addMinutes(nowIndicatorState.now, 0) : null;
  const { pastTime, futureTime, showNowIndicator } = useThemeStore().week;
  const shouldConvert = Boolean(
    targetTimezone && sourceTimezone && targetTimezone !== sourceTimezone
  );

  return (
    <div role="rowgroup" className={classNames.hourRows} style={{ width: toPercent(width) }}>
      {displayLabel ? (
        <div className={cls(addTimeGridPrefix('timezone-label'))} title={displayLabel}>
          {displayLabel}
        </div>
      ) : null}
      {rowsInfo.map(({ date, top, className }) => {
        // isPast 始终基于网格墙钟（主时区/本地）判定，避免副轴转换影响过去/未来配色
        const isPast = !isNil(zoneNow) && date.isBefore(zoneNow);
        // 副轴：把网格墙钟从主时区转换到目标时区后再格式化刻度
        const labelDate = shouldConvert
          ? convertTimezone(date, sourceTimezone as string, targetTimezone as string)
          : date;

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
              param={{ time: labelDate }}
              as="span"
            />
          </div>
        );
      })}
      {showNowLabel && showNowIndicator && !isNil(nowIndicatorState) && !isNil(zoneNow) && (
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
  /** 副时区轴（主轴左侧，依顺序向左排列） */
  timezones?: SchedulerTimezone[];
  /** 主显示时区（网格墙钟所属时区），缺省为浏览器本地时区 */
  primaryTimezone?: string;
  /** gutter 总宽度覆盖（多时区时由宿主视图按轴数计算） */
  width?: string;
}

function TimeColumn({
  timeGridRows,
  nowIndicatorState,
  timezones = [],
  primaryTimezone,
  width: widthOverride,
}: TimeColumnProps) {
  const { week } = useThemeStore();
  const { timeGridLeft, showNowIndicator } = week;
  const width = widthOverride ?? timeGridLeft.width;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowsByHour, nowIndicatorState]
  );

  const primaryTimezoneHourRowsProps = rowsByHour.map((row, index) =>
    hourRowsPropsMapper(row, index)
  );

  // 网格墙钟所属时区：优先用宿主指定的 displayTimezone，否则用浏览器本地时区
  const sourceTimezone =
    primaryTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? undefined;
  const axisCount = timezones.length + 1;
  const axisWidth = 100 / axisCount;

  return (
    <div className={classNames.timeColumn} style={{ width, display: 'flex' }}>
      {/* 副时区轴：依配置顺序排在主轴左侧 */}
      {timezones.map((tz) => (
        <HourRows
          key={tz.timezone}
          rowsInfo={primaryTimezoneHourRowsProps}
          width={axisWidth}
          nowIndicatorState={nowIndicatorState}
          targetTimezone={tz.timezone}
          sourceTimezone={sourceTimezone}
          displayLabel={tz.displayLabel}
        />
      ))}
      {/* 主轴：紧邻日期网格，保持原有 HH:mm 刻度并承载当前时间标签 */}
      <HourRows
        rowsInfo={primaryTimezoneHourRowsProps}
        width={axisWidth}
        showNowLabel
        nowIndicatorState={nowIndicatorState}
      />
    </div>
  );
}

export default memo(TimeColumn);
