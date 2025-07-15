import DayjsTZDate from '@/time/dayjs-tzdate';
import { limit, ratio } from '@/utils/math';

/**
 * 获取时间在指定时间段内的百分比
 * @param date 当前时间
 * @param start 开始时间
 * @param end 结束时间
 * @returns 时间在指定时间段内的百分比
 */
export function getTopPercentByTime(date: DayjsTZDate, start: DayjsTZDate, end: DayjsTZDate) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const time = limit(date.getTime(), [startTime], [endTime]) - startTime;
  const max = endTime - startTime;

  const topPercent = ratio(max, 100, time);

  return limit(topPercent, [0], [100]);
}

export function getTopHeightByTime(
  start: DayjsTZDate,
  end: DayjsTZDate,
  minTime: DayjsTZDate,
  maxTime: DayjsTZDate
) {
  const top = getTopPercentByTime(start, minTime, maxTime);
  const bottom = getTopPercentByTime(end, minTime, maxTime);
  const height = bottom - top;

  return {
    top,
    height,
  };
}
