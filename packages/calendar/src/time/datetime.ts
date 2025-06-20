import { CellStyle, FormattedTimeString } from '@/types/datetime.type';
import { clone, fill, range } from 'lodash-es';
import DayjsTZDate from './dayjs-tzdate';

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
  console.log('🚀 ~ dates:', dates);

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
