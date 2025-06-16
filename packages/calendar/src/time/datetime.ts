import { FormattedTimeString } from '@/types/datetime.type';
import { clone } from 'lodash-es';
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
