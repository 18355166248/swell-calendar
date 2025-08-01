/* eslint-disable no-undefined */
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import type { DayjsTZDateMethods, TimezoneValue } from './dayjs-tzdate.types';

// 启用 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/**
 * 基于 Dayjs 的时区感知日期类
 *
 * 这是一个全新的实现，完全基于 dayjs，提供了与原生 Date 兼容的 API，
 * 同时支持时区处理和不可变操作。
 *
 * 特性：
 * - 不可变操作 - 所有修改操作返回新实例
 * - 时区感知 - 支持 IANA 时区名称和偏移量
 * - 链式调用 - 支持方法链式调用
 * - 类型安全 - 完整的 TypeScript 类型支持
 *
 * @class DayjsTZDate
 * @param {...any[]} args - 构造参数，支持多种格式
 */
export default class DayjsTZDate implements DayjsTZDateMethods {
  readonly dayjs: Dayjs;

  tzOffset: number | null = null;

  constructor(...args: any[]) {
    let dayjsInstance: Dayjs;

    if (args.length === 0) {
      // 无参数 - 当前时间
      dayjsInstance = dayjs();
    } else if (args[0] instanceof DayjsTZDate) {
      // 从另一个 DayjsTZDate 实例创建
      dayjsInstance = args[0].dayjs;
      this.tzOffset = args[0].tzOffset;
    } else if (args[0] instanceof Date) {
      // 从 Date 对象创建
      dayjsInstance = dayjs(args[0]);
    } else if (typeof args[0] === 'string') {
      // 从字符串创建
      dayjsInstance = dayjs(args[0]);
    } else if (typeof args[0] === 'number') {
      if (args.length === 1) {
        // 时间戳
        dayjsInstance = dayjs(args[0]);
      } else {
        // 年月日时分秒毫秒
        const [year, month = 0, date = 1, hour = 0, minute = 0, second = 0, millisecond = 0] =
          args as number[];
        dayjsInstance = dayjs()
          .year(year)
          .month(month) // dayjs 的月份是 0-based
          .date(date)
          .hour(hour)
          .minute(minute)
          .second(second)
          .millisecond(millisecond);
      }
    } else {
      // 默认当前时间
      dayjsInstance = dayjs();
    }

    this.dayjs = dayjsInstance;

    this.tzOffset = this.tzOffset ?? null;
  }

  format(format: string): string {
    return this.dayjs.format(format);
  }

  /**
   * 获取字符串表示
   */
  toString(): string {
    return this.dayjs.toString();
  }

  /**
   * 获取数值表示（时间戳）
   */
  valueOf(): number {
    return this.dayjs.valueOf();
  }

  /**
   * 转换为原生 Date 对象
   */
  toDate(): Date {
    return this.dayjs.toDate();
  }

  // ==================== 时间获取方法 ====================

  /**
   * 获取时间戳（毫秒）
   */
  getTime(): number {
    return this.dayjs.valueOf();
  }

  /**
   * 获取年份
   */
  getFullYear(): number {
    return this.dayjs.year();
  }

  /**
   * 获取月份（0-based，与 Date 保持一致）
   */
  getMonth(): number {
    return this.dayjs.month();
  }

  /**
   * 获取日期
   */
  getDate(): number {
    return this.dayjs.date();
  }

  /**
   * 获取小时
   */
  getHours(): number {
    return this.dayjs.hour();
  }

  /**
   * 获取分钟
   */
  getMinutes(): number {
    return this.dayjs.minute();
  }

  /**
   * 获取秒
   */
  getSeconds(): number {
    return this.dayjs.second();
  }

  /**
   * 获取毫秒
   */
  getMilliseconds(): number {
    return this.dayjs.millisecond();
  }

  /**
   * 获取星期几（0=周日，1=周一，...，6=周六）
   */
  getDay(): number {
    return this.dayjs.day();
  }

  /**
   * 获取时区偏移量（分钟）
   */
  getTimezoneOffset(): number {
    if (this.tzOffset !== null) {
      return this.tzOffset;
    }

    // 使用 dayjs 的默认时区偏移
    return -this.dayjs.utcOffset();
  }

  // ==================== 时间设置方法（返回新实例）====================

  /**
   * 设置时间戳
   */
  setTime(t: number): DayjsTZDate {
    const newInstance = new DayjsTZDate(t);
    newInstance.tzOffset = this.tzOffset;

    return newInstance;
  }

  /**
   * 设置年月日
   */
  setFullYear(y: number, m?: number, d?: number): DayjsTZDate {
    let newDayjs = this.dayjs.year(y);
    if (m !== undefined) {
      newDayjs = newDayjs.month(m);
    }
    if (d !== undefined) {
      newDayjs = newDayjs.date(d);
    }

    return this._createNewInstance(newDayjs);
  }

  /**
   * 设置月份
   */
  setMonth(m: number, d?: number): DayjsTZDate {
    let newDayjs = this.dayjs.month(m);
    if (d !== undefined) {
      newDayjs = newDayjs.date(d);
    }

    return this._createNewInstance(newDayjs);
  }

  /**
   * 设置日期
   */
  setDate(d: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.date(d));
  }

  /**
   * 设置小时、分钟、秒、毫秒
   */
  setHours(h: number, M?: number, s?: number, ms?: number): DayjsTZDate {
    let newDayjs = this.dayjs.hour(h);
    if (M !== undefined) {
      newDayjs = newDayjs.minute(M);
    }
    if (s !== undefined) {
      newDayjs = newDayjs.second(s);
    }
    if (ms !== undefined) {
      newDayjs = newDayjs.millisecond(ms);
    }

    return this._createNewInstance(newDayjs);
  }

  /**
   * 设置分钟、秒、毫秒
   */
  setMinutes(M: number, s?: number, ms?: number): DayjsTZDate {
    let newDayjs = this.dayjs.minute(M);
    if (s !== undefined) {
      newDayjs = newDayjs.second(s);
    }
    if (ms !== undefined) {
      newDayjs = newDayjs.millisecond(ms);
    }

    return this._createNewInstance(newDayjs);
  }

  /**
   * 设置秒、毫秒
   */
  setSeconds(s: number, ms?: number): DayjsTZDate {
    let newDayjs = this.dayjs.second(s);
    if (ms !== undefined) {
      newDayjs = newDayjs.millisecond(ms);
    }

    return this._createNewInstance(newDayjs);
  }

  /**
   * 设置毫秒
   */
  setMilliseconds(ms: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.millisecond(ms));
  }

  // ==================== 时间添加方法（返回新实例）====================

  /**
   * 添加年份
   */
  addFullYear(y: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.add(y, 'year'));
  }

  /**
   * 添加月份
   */
  addMonth(m: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.add(m, 'month'));
  }

  /**
   * 添加天数
   */
  addDate(d: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.add(d, 'day'));
  }

  /**
   * 添加小时
   */
  addHours(h: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.add(h, 'hour'));
  }

  /**
   * 添加分钟
   */
  addMinutes(M: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.add(M, 'minute'));
  }

  /**
   * 添加秒
   */
  addSeconds(s: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.add(s, 'second'));
  }

  /**
   * 添加毫秒
   */
  addMilliseconds(ms: number): DayjsTZDate {
    return this._createNewInstance(this.dayjs.add(ms, 'millisecond'));
  }

  /**
   * 批量设置年月日时分秒毫秒
   */
  // eslint-disable-next-line max-params
  setWithRaw(
    y: number,
    m: number,
    d: number,
    h: number,
    M: number,
    s: number,
    ms: number
  ): DayjsTZDate {
    const newDayjs = this.dayjs
      .year(y)
      .month(m)
      .date(d)
      .hour(h)
      .minute(M)
      .second(s)
      .millisecond(ms);

    return this._createNewInstance(newDayjs);
  }

  // ==================== 时区方法 ====================

  /**
   * 设置时区
   * @param tzValue - 时区值（IANA名称、偏移量或'Local'）
   */
  tz(tzValue: TimezoneValue): DayjsTZDate {
    if (tzValue === 'Local') {
      // 转换为本地时区
      const newDayjs = this.dayjs.local();
      return this._createNewInstance(newDayjs, null);
    }

    if (typeof tzValue === 'string') {
      // IANA 时区名称
      const newDayjs = this.dayjs.tz(tzValue);
      const tzOffset = -newDayjs.utcOffset(); // dayjs 的 utcOffset 是相反的
      return this._createNewInstance(newDayjs, tzOffset);
    }

    if (typeof tzValue === 'number') {
      // 数字偏移量（分钟）
      const newDayjs = this.dayjs.utcOffset(-tzValue); // dayjs 的 utcOffset 是相反的
      return this._createNewInstance(newDayjs, tzValue);
    }

    return this;
  }

  /**
   * 转换为本地时区
   * @param tzValue - 可选的源时区值
   */
  local(tzValue?: TimezoneValue): DayjsTZDate {
    if (tzValue !== undefined) {
      // 先设置为指定时区，再转换为本地时区
      return this.tz(tzValue).local();
    }

    // 如果当前实例有时区偏移，需要先恢复再转换为本地时区
    if (this.tzOffset !== null) {
      const utcTime = this.dayjs.utc();
      const localDayjs = utcTime.local();
      return this._createNewInstance(localDayjs, null);
    }

    const localDayjs = this.dayjs.local();
    return this._createNewInstance(localDayjs, null);
  }

  isBefore(d: DayjsTZDate): boolean {
    return this.dayjs.isBefore(d.dayjs);
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 创建新实例（保持时区偏移）
   */
  private _createNewInstance(newDayjs: Dayjs, tzOffset?: number | null): DayjsTZDate {
    const instance = Object.create(DayjsTZDate.prototype);
    instance.dayjs = newDayjs;
    instance.tzOffset = tzOffset !== undefined ? tzOffset : this.tzOffset;

    return instance;
  }
}
