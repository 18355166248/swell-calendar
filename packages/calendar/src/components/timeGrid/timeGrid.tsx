import { addTimeGridPrefix, className } from '@/constants/timeGrid-const';
import TimeColumn from './TimeColumn';
import { TimeGridData } from '@/types/grid.type';
import { cls } from '@/helpers/css';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { isSameDate, setTimeStrToDate } from '@/time/datetime';
import { isNil, last } from 'lodash-es';
import { getTopPercentByTime } from '@/controller/time.controller';
import { useIsMounted } from '@/hooks/common/useIsMounted';

const classNames = {
  timeGrid: cls(className),
  scrollArea: cls(addTimeGridPrefix('scroll-area')),
};

export interface TimeGridProps {
  timeGridData: TimeGridData;
}

export function TimeGrid({ timeGridData }: TimeGridProps) {
  const { columns } = timeGridData;

  // 组件挂载状态检查
  const isMounted = useIsMounted();

  // 当前时间指示器的状态
  const [nowIndicatorState, setNowIndicatorState] = useState<{
    top: number; // 指示器距离顶部的百分比位置
    now: DayjsTZDate; // 当前时间
  } | null>(null);

  /**
   * 计算当前日期相关数据
   * 用于确定是否需要显示当前时间指示器
   */
  const currentDateData = useMemo(() => {
    const now = new DayjsTZDate().local();
    const currentDateIndexInColumns = columns.findIndex((col) => isSameDate(col.date, now));
    if (currentDateIndexInColumns < 0) return null;

    const startTime = setTimeStrToDate(
      columns[currentDateIndexInColumns].date,
      timeGridData.rows[0].startTime
    );

    const endTime = setTimeStrToDate(
      columns[currentDateIndexInColumns].date,
      last(timeGridData.rows)!.endTime
    );

    return {
      startTime,
      endTime,
      currentDateIndex: currentDateIndexInColumns,
    };
  }, [columns, timeGridData.rows]);

  /**
   * 更新时间指示器位置
   * 计算当前时间在网格中的垂直位置百分比
   */
  const updateTimeIndicatorPosition = useCallback(() => {
    if (!isNil(currentDateData)) {
      const { startTime, endTime } = currentDateData;
      const now = new DayjsTZDate().local();
      if (startTime <= now && now <= endTime) {
        setNowIndicatorState({
          top: getTopPercentByTime(now, startTime, endTime),
          now,
        });
      }
    }
  }, [currentDateData]);

  useLayoutEffect(() => {
    if (isMounted()) {
      if (currentDateData?.currentDateIndex ?? -1 >= 0) {
        updateTimeIndicatorPosition();
      } else {
        setNowIndicatorState(null);
      }
    }
  }, [isMounted, updateTimeIndicatorPosition, currentDateData]);

  return (
    <div className={classNames.timeGrid}>
      <div className={classNames.scrollArea}>
        {/* 时间轴 */}
        <TimeColumn timeGridRows={timeGridData.rows} />
      </div>
    </div>
  );
}
