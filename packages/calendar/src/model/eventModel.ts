import { isString } from 'lodash-es';

import { collidesWith } from '@/helpers/event';
import { MS_PER_DAY, parseDateTime, toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { convertTimezone, needsTimezoneConversion } from '@/time/timezone';
import {
  DateType,
  EventCategory,
  EventObject,
  EventObjectWithDefaultValues,
} from '@/types/events.type';
import { stamp } from '@/utils/stamp';

import { EventUIModel } from './eventUIModel';

export class EventModel implements EventObject {
  id = '';
  /** 所属日历的ID */
  calendarId = '';
  title = '';
  start: DayjsTZDate = new DayjsTZDate();
  end: DayjsTZDate = new DayjsTZDate();
  allDay = false;
  isAllday = false;
  // 事件类别：time(时间事件)、allday(全天事件)、milestone(里程碑)、task(任务)
  category: EventCategory = 'time';
  isVisible = true;
  /** 是否为只读事件 */
  isReadOnly = false;
  editable = true;
  draggable = true;
  resizable = true;
  order?: number;
  dragBetweenResources?: boolean;
  // 是否包含多个日期
  hasMultiDates = false;
  /** 前往事件地点的行程时间（分钟） */
  goingDuration = 0;
  /** 从事件地点返回的行程时间（分钟） */
  comingDuration = 0;
  /** 事件文字颜色 */
  color?: string;
  /** 事件背景颜色 */
  backgroundColor?: string;
  /** 拖拽时的背景颜色 */
  dragBackgroundColor?: string;
  /** 事件边框颜色 */
  borderColor?: string;
  /** 原始事件数据 */
  raw: EventObject['raw'] = null;
  /** 资源ID，用于 Scheduler 视图 */
  resourceId?: string;
  resourceIds?: string[];
  timezone?: string;
  /**
   * 显示时区名（仅在调度器 timezone 转换后设置）。
   *
   * toEventObject() 里如果检测到 timezone 和 _displayTimezone 都存在且不同，
   * 会把渲染用的 display-timezone 墙钟时间反向转换回数据 timezone，
   * 保证所有回调 payload 永远输出数据时区下的自洽值。
   */
  _displayTimezone?: string;
  recurrence?: EventObject['recurrence'];
  recurringExceptions?: EventObject['recurringExceptions'];
  recurringExceptionRule?: EventObject['recurringExceptionRule'];
  /** 展开实例专属：父事件 ID */
  recurrenceParentId?: string;
  /** 展开实例专属：原始发生日期 */
  recurrenceOccurrenceDate?: DateType;
  cssClass?: string;
  meta?: Record<string, unknown>;

  constructor(public event: EventObject) {
    stamp(this);

    this.init(event);
  }

  init({
    id = '',
    calendarId = '',
    title = '',
    start = new DayjsTZDate(),
    end = new DayjsTZDate(),
    isAllday = false,
    allDay = false,
    isReadOnly = false,
    category = 'time',
    backgroundColor = '',
    dragBackgroundColor = '',
    borderColor = '',
    color = '',
    editable = true,
    draggable = true,
    resizable = true,
    order,
    dragBetweenResources,
    raw = null,
    resourceId,
    resourceIds,
    timezone,
    recurrence,
    recurringExceptions,
    recurringExceptionRule,
    recurrenceParentId,
    recurrenceOccurrenceDate,
    cssClass,
    meta,
  }: EventObject) {
    const normalizedAllDay = category === 'allday' || isAllday || allDay;

    this.id = id;
    this.calendarId = calendarId;
    this.title = title;
    this.allDay = normalizedAllDay;
    this.isAllday = normalizedAllDay;
    this.category = category;
    this.backgroundColor = backgroundColor;
    this.dragBackgroundColor = dragBackgroundColor;
    this.borderColor = borderColor;
    this.color = color;
    this.isReadOnly = isReadOnly;
    this.editable = editable;
    this.draggable = draggable;
    this.resizable = resizable;
    this.order = order;
    this.dragBetweenResources = dragBetweenResources;
    this.raw = raw;
    this.resourceId = resourceId;
    this.resourceIds = resourceIds;
    this.timezone = timezone;
    this.recurrence = recurrence;
    this.recurringExceptions = recurringExceptions;
    this.recurringExceptionRule = recurringExceptionRule;
    this.recurrenceParentId = recurrenceParentId;
    this.recurrenceOccurrenceDate = recurrenceOccurrenceDate;
    this.cssClass = cssClass;
    this.meta = meta;

    // 根据事件类型设置时间周期
    if (this.allDay) {
      this.setAlldayPeriod(start, end);
    } else {
      this.setTimePeriod(start, end);
    }
  }

  /**
   * 设置全天事件的时间周期
   * @param start 开始时间
   * @param end 结束时间
   */
  setAlldayPeriod(start?: DateType, end?: DateType) {
    // 全天事件只使用日期信息，忽略时间部分
    let startedAt: DayjsTZDate;
    let endedAt: DayjsTZDate;

    if (isString(start)) {
      // 如果是字符串，只取前10位（日期部分）
      startedAt = parseDateTime(start.substring(0, 10));
    } else {
      startedAt = new DayjsTZDate(start || Date.now());
    }

    if (isString(end)) {
      endedAt = parseDateTime(end.substring(0, 10));
    } else {
      endedAt = new DayjsTZDate(end || this.start);
    }

    this.start = startedAt;
    this.start.setHours(0, 0, 0); // 设置为当天开始
    this.end = (endedAt as DayjsTZDate) || new DayjsTZDate(this.start);
    this.end.setHours(23, 59, 59); // 设置为当天结束
  }

  /**
   * 设置时间事件的时间周期
   * @param start 开始时间
   * @param end 结束时间
   */
  setTimePeriod(start?: DateType, end?: DateType) {
    this.start = new DayjsTZDate(start || Date.now());
    this.end = new DayjsTZDate(end || this.start);

    // 如果没有指定结束时间，默认设置为开始时间后30分钟
    if (!end) {
      this.end = this.end.setMinutes(this.end.getMinutes() + 30);
    }

    // 检查是否跨越多个日期（超过24小时）
    // 这个属性对事件卡片的宽度计算很重要
    this.hasMultiDates = this.end.getTime() - this.start.getTime() > MS_PER_DAY;
  }

  /**
   * 获取实例的唯一ID
   * @returns {number} 唯一标识符
   */
  cid(): number {
    return stamp(this);
  }
  /**
   * 获取渲染用的开始时间
   * @returns {TZDate} 开始时间
   */
  getStarts() {
    return this.start;
  }
  /**
   * 获取渲染用的结束时间
   * @returns {TZDate} 结束时间
   */
  getEnds() {
    return this.end;
  }
  getResourceId() {
    return this.resourceId;
  }
  /**
   * 计算事件的持续时间
   * @returns {number} 持续时间（毫秒，UTC时间）
   */
  duration(): number {
    const start = this.getStarts();
    const end = this.getEnds();
    let duration: number;

    if (this.allDay) {
      // 全天事件：从开始日期的开始到结束日期的结束
      duration = Number(toEndOfDay(end)) - Number(toStartOfDay(start));
    } else {
      // 时间事件：直接计算时间差
      duration = end.getTime() - start.getTime();
    }

    return duration;
  }
  /**
   * 重写valueOf方法，用于事件排序
   * @returns {EventModel} 事件数据模型
   */
  valueOf(): EventModel {
    return this;
  }
  collidesWith(event: EventModel | EventUIModel, usingTravelTime = true) {
    // 如果是UI模型，获取其底层的事件模型
    event = event instanceof EventUIModel ? event.model : event;

    return collidesWith({
      start: Number(this.getStarts()),
      end: Number(this.getEnds()),
      targetStart: Number(event.getStarts()),
      targetEnd: Number(event.getEnds()),
      goingDuration: this.goingDuration,
      comingDuration: this.comingDuration,
      targetGoingDuration: event.goingDuration,
      targetComingDuration: event.comingDuration,
      usingTravelTime, // 日网格不使用行程时间，时间网格使用行程时间
    });
  }
  /**
   * 获取事件的颜色配置
   * @returns 包含所有颜色属性的对象
   */
  getColors() {
    return {
      color: this.color,
      backgroundColor: this.backgroundColor,
      dragBackgroundColor: this.dragBackgroundColor,
      borderColor: this.borderColor,
      editable: this.editable,
      draggable: this.draggable,
      resizable: this.resizable,
      order: this.order,
      timezone: this.timezone,
      recurrence: this.recurrence,
      recurringExceptions: this.recurringExceptions,
      recurringExceptionRule: this.recurringExceptionRule,
      cssClass: this.cssClass,
      meta: this.meta,
    };
  }

  /**
   * 将事件模型转换为事件对象
   * @returns {EventObjectWithDefaultValues} 事件对象
   */
  toEventObject(): EventObjectWithDefaultValues {
    const start =
      this._displayTimezone && needsTimezoneConversion(this.timezone, this._displayTimezone)
        ? convertTimezone(this.start, this._displayTimezone, this.timezone!)
        : this.start;
    const end =
      this._displayTimezone && needsTimezoneConversion(this.timezone, this._displayTimezone)
        ? convertTimezone(this.end, this._displayTimezone, this.timezone!)
        : this.end;

    const result: EventObjectWithDefaultValues = {
      id: this.id,
      calendarId: this.calendarId,
      __cid: this.cid(),
      title: this.title,
      isAllday: this.allDay,
      allDay: this.allDay,
      isReadOnly: this.isReadOnly,
      start,
      end,
      goingDuration: this.goingDuration,
      comingDuration: this.comingDuration,
      category: this.category,
      isVisible: this.isVisible,
      color: this.color,
      backgroundColor: this.backgroundColor,
      dragBackgroundColor: this.dragBackgroundColor,
      borderColor: this.borderColor,
      editable: this.editable,
      draggable: this.draggable,
      resizable: this.resizable,
      order: this.order,
      dragBetweenResources: this.dragBetweenResources,
      raw: this.raw,
      resourceId: this.resourceId,
      resourceIds: this.resourceIds,
      timezone: this.timezone,
      recurrence: this.recurrence,
      recurringExceptions: this.recurringExceptions,
      recurringExceptionRule: this.recurringExceptionRule,
      recurrenceParentId: this.recurrenceParentId,
      recurrenceOccurrenceDate: this.recurrenceOccurrenceDate,
      cssClass: this.cssClass,
      meta: this.meta,
    };
    // 携带 _displayTimezone 穿过 toEventObject → new EventModel 往返，
    // 使 splitMultiDayTimeEvents / createUpdatedTimeGridEvent 等下游
    // 仍然知道需要反向转换
    (result as Record<string, unknown>)._displayTimezone = this._displayTimezone;
    return result;
  }
}

/**
 * 判断是否为时间事件（非全天、非多日事件）
 * 这个函数用于确定事件卡片的渲染方式
 * @param {EventUIModel} eventUI 事件UI模型
 * @returns {boolean} 如果是时间事件返回true
 */
export function isTimeEvent({ model }: EventUIModel) {
  const { category, allDay, hasMultiDates } = model;

  // 时间事件：类别为time，非全天，非多日
  return category === 'time' && !allDay && !hasMultiDates;
}
