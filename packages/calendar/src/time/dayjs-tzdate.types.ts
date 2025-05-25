import type { Dayjs } from 'dayjs';

/**
 * Dayjs 版本的时区感知日期类型定义
 */
export interface DayjsTZDateInterface {
  // 构造参数类型
  readonly dayjs: Dayjs;
  readonly tzOffset: number | null;
}

/**
 * 时区值类型 - 支持 IANA 时区名称、数字偏移量或 'Local'
 */
export type TimezoneValue = string | 'Local' | number;

/**
 * 构造函数参数类型
 */
export type DayjsTZDateConstructorArgs =
  | []
  | [DayjsTZDateType]
  | [Date]
  | [string]
  | [number]
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | [number, number, number, number, number]
  | [number, number, number, number, number, number]
  | [number, number, number, number, number, number, number];

/**
 * 基于 Dayjs 的时区感知日期类接口
 */
export interface DayjsTZDateMethods {
  // 基础方法
  toString(): string;
  valueOf(): number;
  toDate(): Date;

  // 时间获取方法
  getTime(): number;
  getFullYear(): number;
  getMonth(): number;
  getDate(): number;
  getHours(): number;
  getMinutes(): number;
  getSeconds(): number;
  getMilliseconds(): number;
  getDay(): number;
  getTimezoneOffset(): number;

  // 时间设置方法 (返回新实例)
  setTime(t: number): DayjsTZDateType;
  setFullYear(y: number, m?: number, d?: number): DayjsTZDateType;
  setMonth(m: number, d?: number): DayjsTZDateType;
  setDate(d: number): DayjsTZDateType;
  setHours(h: number, M?: number, s?: number, ms?: number): DayjsTZDateType;
  setMinutes(M: number, s?: number, ms?: number): DayjsTZDateType;
  setSeconds(s: number, ms?: number): DayjsTZDateType;
  setMilliseconds(ms: number): DayjsTZDateType;

  // 时间添加方法 (返回新实例)
  addFullYear(y: number): DayjsTZDateType;
  addMonth(m: number): DayjsTZDateType;
  addDate(d: number): DayjsTZDateType;
  addHours(h: number): DayjsTZDateType;
  addMinutes(M: number): DayjsTZDateType;
  addSeconds(s: number): DayjsTZDateType;
  addMilliseconds(ms: number): DayjsTZDateType;

  // 批量设置方法
  setWithRaw(
    y: number,
    m: number,
    d: number,
    h: number,
    M: number,
    s: number,
    ms: number
  ): DayjsTZDateType;

  // 时区方法
  tz(tzValue: TimezoneValue): DayjsTZDateType;
  local(tzValue?: TimezoneValue): DayjsTZDateType;
}

/**
 * 完整的 DayjsTZDateType 类型
 */
export type DayjsTZDateType = DayjsTZDateInterface & DayjsTZDateMethods;
