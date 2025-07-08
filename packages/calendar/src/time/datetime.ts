import { CellStyle, FormattedTimeString } from '@/types/datetime.type';
import { clone, fill, range } from 'lodash-es';
import DayjsTZDate from './dayjs-tzdate';
import { UnitTypeLong } from 'dayjs';

/**
 * 星期枚举
 * 定义一周中的每一天，从周日开始
 */
export enum Day {
  SUN, // 周日
  MON, // 周一
  TUE, // 周二
  WED, // 周三
  THU, // 周四
  FRI, // 周五
  SAT, // 周六
}

/**
 * 一周的天数常量
 */
export const WEEK_DAYS = 7;

export const MS_PER_DAY = 86400000; // 一天的毫秒数
export const MS_PER_HOUR = 3600000; // 一小时的毫秒数
export const MS_PER_MINUTES = 60000; // 一分钟的毫秒数

/**
 * The number of milliseconds 20 minutes for event min duration
 */
export const MS_EVENT_MIN_DURATION = 20 * MS_PER_MINUTES;

/**
 * 判断是否为周末
 * @param day 星期枚举值
 * @returns 如果是周六或周日返回 true，否则返回 false
 */
export function isWeekend(day: Day): boolean {
  return day === Day.SUN || day === Day.SAT;
}

/**
 * 判断是否为周日
 * @param day 星期枚举值
 * @returns 如果是周日返回 true，否则返回 false
 */
export function isSunday(day: Day): boolean {
  return day === Day.SUN;
}

/**
 * 判断是否为周六
 * @param day 星期枚举值
 * @returns 如果是周六返回 true，否则返回 false
 */
export function isSaturday(day: Day): boolean {
  return day === Day.SAT;
}

/**
 * 将时间字符串设置到日期对象中
 * @param d DayjsTZDate 日期对象
 * @param timeStr 格式化的时间字符串 (格式: "HH:mm")
 * @returns 设置了新时间的日期对象副本
 */
export function setTimeStrToDate(d: DayjsTZDate, timeStr: FormattedTimeString) {
  let date = clone(d);
  date = date.setHours(...(timeStr.split(':').map(Number) as [number, number]));

  return date;
}

export function isSameYear(d1: DayjsTZDate, d2: DayjsTZDate): boolean {
  return d1.getFullYear() === d2.getFullYear();
}

export function isSameMonth(d1: DayjsTZDate, d2: DayjsTZDate): boolean {
  return isSameYear(d1, d2) && d1.getMonth() === d2.getMonth();
}

export function isSameDate(d1: DayjsTZDate, d2: DayjsTZDate): boolean {
  return isSameMonth(d1, d2) && d1.getDate() === d2.getDate();
}

/**
 * 计算日历网格的样式信息，包括每列的宽度和位置
 *
 * 该函数根据不同的显示模式（窄周末、工作日模式等）计算日历网格中每列的宽度百分比和左侧位置，
 * 并生成单元格宽度映射表，用于支持跨列事件显示和拖拽功能。
 *
 * @param days - 要显示的天数（通常为7天，表示一周）
 * @param narrowWeekend - 是否启用窄周末模式，周末列宽度减半
 * @param startDayOfWeek - 一周的起始日（0=周日，1=周一，以此类推）
 * @param workweek - 是否为工作日模式，只显示工作日（周一到周五）
 * @returns 返回包含行样式信息和单元格宽度映射的对象
 *   - rowStyleInfo: 每列的样式信息数组，包含 width（宽度百分比）和 left（左侧位置百分比）
 *   - cellWidthMap: 二维数组，表示从第i列到第j列的累计宽度百分比
 */
export function getRowStyleInfo(
  days: number,
  narrowWeekend: boolean,
  startDayOfWeek: number,
  workweek: boolean
): {
  rowStyleInfo: CellStyle[];
  cellWidthMap: number[][];
} {
  // 应用窄周末模式的最小天数限制（5天以下不应用窄周末）
  const limitDaysToApplyNarrowWeekend = 5;

  // 计算均匀宽度：总宽度100%除以天数
  const uniformWidth = 100 / days;

  // 计算宽列宽度：当启用窄周末且天数大于限制时，非周末列会变宽
  // 宽列宽度 = 100% / (总天数 - 1)，因为周末列宽度减半
  const wideWidth = days > limitDaysToApplyNarrowWeekend ? 100 / (days - 1) : uniformWidth;

  // 累计宽度，用于计算每列的左侧位置
  let accumulatedWidth = 0;

  // 生成日期数组：从起始日到周末，然后从0到天数-1，最后截取到一周长度
  // 例如：startDayOfWeek=1, days=7 => [1,2,3,4,5,6,0] => [1,2,3,4,5,6,0]
  const dates = range(startDayOfWeek, WEEK_DAYS).concat(range(days)).slice(0, WEEK_DAYS);

  // 工作日模式下强制禁用窄周末
  narrowWeekend = workweek ? false : narrowWeekend;

  const rowStyleInfo = dates.map((day) => {
    let width = narrowWeekend ? wideWidth : uniformWidth;

    // 如果是窄周末模式且天数大于限制且当前是周末，则宽度减半
    if (days > limitDaysToApplyNarrowWeekend && narrowWeekend && isWeekend(day)) {
      width = wideWidth / 2;
    }

    // 创建列样式模型
    const model = {
      width, // 当前列宽度百分比
      left: accumulatedWidth, // 当前列左侧位置百分比
    };

    // 累加宽度，为下一列计算左侧位置
    accumulatedWidth += width;

    return model;
  });

  // 获取列数
  const { length } = rowStyleInfo;
  // 初始化单元格宽度映射表：二维数组，初始值为0
  const cellWidthMap = Array.from({ length }, () => Array(length).fill(0));

  // 计算单元格宽度映射表
  // cellWidthMap[i][j] 表示从第i列到第j列的累计宽度
  rowStyleInfo.forEach(({ width }, index) => {
    // 遍历所有可能的起始列
    for (let i = 0; i <= index; i += 1) {
      // 遍历所有可能的结束列
      for (let j = index; j < length; j += 1) {
        // 累加当前列宽度到对应的单元格宽度映射
        cellWidthMap[i][j] += width;
      }
    }
  });

  // 确保整个网格的总宽度为100%
  cellWidthMap[0][length - 1] = 100;

  return { rowStyleInfo, cellWidthMap };
}

export function addMinutes(d: DayjsTZDate, minutes: number) {
  const date = clone(d);
  date.setMinutes(d.getMinutes() + minutes);

  return date;
}

// 获取过滤范围
export function getFilterRange(day: DayjsTZDate) {
  const start = day.setHours(0, 0, 0, 0);
  const end = day.setHours(23, 59, 59, 999);

  return [start, end];
}

/**
 * 根据起始日期、结束日期和步长生成日期数组
 *
 * 该函数用于生成一个从起始日期到结束日期的日期序列，每个日期之间的间隔由步长参数决定。
 * 步长以毫秒为单位，常用于生成日历视图中的时间网格或事件时间轴。
 *
 * @param startDate - 起始日期对象
 * @param endDate - 结束日期对象
 * @param step - 日期间隔步长（毫秒）
 * @returns 返回包含所有日期对象的数组，按时间顺序排列
 *
 * @example
 * // 生成一天内每小时的日期数组
 * const start = new DayjsTZDate('2024-01-01 00:00:00');
 * const end = new DayjsTZDate('2024-01-01 23:59:59');
 * const hourlyDates = makeDateRange(start, end, MS_PER_HOUR);
 */
export function makeDateRange(
  startDate: DayjsTZDate,
  endDate: DayjsTZDate,
  step: number
): DayjsTZDate[] {
  // 获取起始和结束时间的时间戳（毫秒）
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  // 创建起始日期的副本，用于迭代
  const date = new DayjsTZDate(startDate);

  // 初始化结果数组
  const result: DayjsTZDate[] = [];

  // 当前时间游标，从起始时间开始
  let cursor = startTime;

  // 循环生成日期序列
  // 条件1: cursor <= endTime - 确保不超过结束时间
  // 条件2: endTime >= date.getTime() - 双重检查，确保日期对象的时间不超过结束时间
  while (cursor <= endTime && endTime >= date.getTime()) {
    // 将当前日期对象的副本添加到结果数组
    result.push(new DayjsTZDate(date));

    // 更新游标，移动到下一个时间点
    cursor = cursor + step;

    // 更新日期对象，增加指定的毫秒数
    date.addMilliseconds(step);
  }

  return result;
}

export function toStartOfDay(date?: DayjsTZDate): DayjsTZDate {
  let d = date ? new DayjsTZDate(date) : new DayjsTZDate();

  d = d.setHours(0, 0, 0, 0);

  return d;
}

export function toEndOfDay(date?: DayjsTZDate): DayjsTZDate {
  const d = date ? new DayjsTZDate(date) : new DayjsTZDate();

  d.setHours(23, 59, 59, 999);

  return d;
}

/**
 * 比较两个日期对象的时间先后顺序
 *
 * 该函数用于比较两个 DayjsTZDate 对象的时间戳，返回一个数值来表示它们的相对顺序。
 * 这种比较方式常用于数组排序、事件时间排序等场景。
 *
 * @param d1 - 第一个日期对象
 * @param d2 - 第二个日期对象
 * @returns 返回比较结果：
 *   - -1: 表示 d1 早于 d2
 *   - 1: 表示 d1 晚于 d2
 *   - 0: 表示 d1 和 d2 时间相同
 *
 * @example
 * const date1 = new DayjsTZDate('2024-01-01 10:00:00');
 * const date2 = new DayjsTZDate('2024-01-01 11:00:00');
 * const result = compare(date1, date2); // 返回 -1，因为 date1 早于 date2
 */
export function compare(d1: DayjsTZDate, d2: DayjsTZDate): number {
  // 获取两个日期对象的时间戳（毫秒数）
  const _d1 = d1.getTime();
  const _d2 = d2.getTime();

  // 如果第一个日期早于第二个日期，返回 -1
  if (_d1 < _d2) {
    return -1;
  }
  // 如果第一个日期晚于第二个日期，返回 1
  if (_d1 > _d2) {
    return 1;
  }

  // 如果两个日期时间相同，返回 0
  return 0;
}

/**
 * 缓存对象
 * 用于存储时间转换的缓存数据
 */
const memo: {
  millisecondsTo: Record<string, number>;
  millisecondsFrom: Record<string, number>;
} = {
  millisecondsTo: {},
  millisecondsFrom: {},
};

// 将时间单位转换为毫秒
export function millisecondsFrom(type: UnitTypeLong, value: number): number {
  const cache = memo.millisecondsFrom;
  const key = type + value;
  if (cache[key]) {
    return cache[key];
  }

  let result: number;

  switch (type) {
    case 'millisecond':
      result = value;
      break;
    case 'second':
      result = value * 1000;
      break;
    case 'minute':
      result = value * MS_PER_MINUTES;
      break;
    case 'hour':
      result = value * MS_PER_HOUR;
      break;
    case 'day':
    case 'date':
      result = value * MS_PER_DAY;
      break;
    case 'month':
      // 月份转换比较复杂，使用平均值（30.44天）
      result = value * MS_PER_DAY * 30.44;
      break;
    case 'year':
      // 年份转换使用平均值（365.25天，考虑闰年）
      result = value * MS_PER_DAY * 365.25;
      break;
    default:
      throw new Error(`不支持的时间单位: ${type}`);
  }

  // 缓存结果
  cache[key] = result;
  return result;
}
