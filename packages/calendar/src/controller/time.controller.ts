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

/**
 * @typedef {Object} VerticalPositionsByTime
 * @property {number} top - 顶部位置百分比 (0-100)
 * @property {number} height - 高度百分比 (0-100)
 */
/**
 * 计算事件在时间网格中的垂直位置和高度
 *
 * 该函数用于确定事件在日历时间视图中应该显示的位置和大小。
 * 通过将时间范围转换为百分比值，实现事件在时间轴上的精确定位。
 *
 * @param {DayjsTZDate} start - 事件的开始时间，将被转换为顶部位置百分比
 * @param {DayjsTZDate} end - 事件的结束时间，用于计算事件高度
 * @param {DayjsTZDate} minTime - 时间网格的最小时间（通常是当天的开始时间）
 * @param {DayjsTZDate} maxTime - 时间网格的最大时间（通常是当天的结束时间）
 * @returns {VerticalPositionsByTime} 包含top和height属性的对象，表示事件的垂直位置信息
 *
 * @example
 * // 假设时间网格从 09:00 到 18:00
 * const minTime = new DayjsTZDate('2024-01-01T09:00:00');
 * const maxTime = new DayjsTZDate('2024-01-01T18:00:00');
 * const eventStart = new DayjsTZDate('2024-01-01T10:00:00');
 * const eventEnd = new DayjsTZDate('2024-01-01T12:00:00');
 *
 * const positions = getTopHeightByTime(eventStart, eventEnd, minTime, maxTime);
 * // 结果: { top: 11.11, height: 22.22 }
 * // 表示事件应该显示在距离顶部11.11%的位置，高度为22.22%
 */
export function getTopHeightByTime(
  start: DayjsTZDate,
  end: DayjsTZDate,
  minTime: DayjsTZDate,
  maxTime: DayjsTZDate
) {
  // 计算事件开始时间相对于时间网格的顶部位置百分比
  const topPercent = getTopPercentByTime(start, minTime, maxTime);
  // 计算事件结束时间相对于时间网格的底部位置百分比
  const bottomPercent = getTopPercentByTime(end, minTime, maxTime);

  // 计算事件的高度百分比
  const height = bottomPercent - topPercent;

  // 返回包含top和height属性的对象，表示事件的垂直位置信息
  return {
    top: topPercent,
    height,
  };
}
