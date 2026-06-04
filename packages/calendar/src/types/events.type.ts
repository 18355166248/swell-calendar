import { KeyboardEvent, MouseEvent } from 'react';
import { MarkOptional } from 'ts-essentials';

import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';

export type Matrix<T> = T[][];
export type Matrix3d<T> = Matrix<T>[];
export type CollisionGroup = Matrix<number>;

export type DayGridEventMatrix = Matrix3d<EventUIModel>;
export type TimeGridEventMatrix = Record<string, Matrix3d<EventUIModel>>;

export type EventModelMap = {
  milestone: EventUIModel[];
  allday: EventUIModel[];
  task: EventUIModel[];
  time: EventUIModel[];
};

export type EventGroupMap = Record<keyof EventModelMap, DayGridEventMatrix | TimeGridEventMatrix>;

export type TimeUnit = 'second' | 'minute' | 'hour' | 'date' | 'month' | 'year';

export type EventCategory = 'milestone' | 'task' | 'allday' | 'time';

export type MouseEventListener = (e: MouseEvent) => void;
export type KeyboardEventListener = (e: KeyboardEvent) => void;

export type DateType = Date | string | number | DayjsTZDate;

export interface RecurrenceRule {
  // 频率：按天 / 周 / 月 / 年
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  // 间隔，默认 1（例如 interval=2 且 frequency='weekly' 表示每 2 周）
  interval?: number;
  // 重复次数上限（与 until 互斥，引擎优先取更早终止的条件）
  count?: number;
  // 重复截止日期（与 count 互斥）
  until?: DateType;
  // 按周几重复，0=周日 6=周六，仅 weekly 时有效
  byWeekDays?: number[];
  // 按月内日期重复，仅 monthly 时有效
  byMonthDays?: number[];
  // 跳过（或替换）的实例日期列表
  exceptions?: DateType[];
}

/**
 * 重复事件的单次异常覆盖
 *
 * 允许宿主对某个特定发生日期替换该实例的事件属性
 * （如时间、标题、背景色等），或标记为跳过。
 */
export interface RecurringException {
  // 要覆盖/跳过的发生日期
  date: DateType;
  // true 表示该次发生被跳过（不渲染）
  skipped?: boolean;
  // 替换该次发生的属性（与 skipped 互斥，skipped 时不生效）
  overrides?: Partial<EventObject>;
}

/**
 * 事件对象接口 - 定义日历事件的基本属性和结构
 *
 * 这个接口描述了日历组件中事件的所有可能属性。
 * 所有属性都是可选的，允许灵活的事件数据配置。
 */
export interface EventObject {
  id?: string; // 事件唯一标识符
  calendarId?: string; // 事件所属日历的ID
  title?: string; // 事件标题
  start?: DateType; // 事件开始时间
  end?: DateType; // 事件结束时间
  isAllday?: boolean; // 是否为全天事件
  allDay?: boolean;
  isReadOnly?: boolean;
  /**
   * 事件类别
   * 定义事件的类型，影响事件在日历中的显示方式
   * 可选值：'milestone'(里程碑)、'task'(任务)、'allday'(全天)、'time'(时间事件)
   */
  category?: EventCategory;
  isVisible?: boolean; // 是否可见
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any; // 原始数据
  timezone?: string;
  recurrence?: RecurrenceRule;
  /**
   * 重复事件异常列表
   *
   * 指定需要跳过或覆盖属性（如时间、标题）的具体发生日期。
   * 仅当 `recurrence` 存在时生效；每个异常按日期匹配，
   * 日期比较使用日期部分（忽略时间）。
   */
  recurringExceptions?: RecurringException[];
  /**
   * 重复异常规则
   *
   * 提供一个与主 recurrence 同结构的规则来派生跳过/替换模式，
   * 例如 "每周一的所有发生都跳过"。
   * 当同时存在 `recurringExceptions` 和 `recurringExceptionRule` 时，
   * 引擎先展开规则，再叠加逐日期异常（逐日期异常优先级更高）。
   */
  recurringExceptionRule?: RecurrenceRule;
  /**
   * 文本颜色
   * 事件元素中文本的颜色值
   * 支持CSS颜色格式：十六进制、RGB、颜色名称等
   */
  color?: string;
  /**
   * 背景颜色
   * 事件元素的背景颜色
   * 用于区分不同类型或重要程度的事件
   */
  backgroundColor?: string;
  /**
   * 拖拽背景颜色
   * 事件在拖拽过程中显示的背景颜色
   * 提供拖拽操作的视觉反馈
   */
  dragBackgroundColor?: string;
  /**
   * 边框颜色
   * 事件元素左边框的颜色
   * 通常用于标识事件类别或状态
   */
  borderColor?: string;
  editable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  overlap?: boolean;
  bufferBefore?: number;
  bufferAfter?: number;
  order?: number;
  dragBetweenResources?: boolean;
  cssClass?: string;
  meta?: Record<string, unknown>;
  goingDuration?: number;
  comingDuration?: number;
  resourceId?: string;
  resourceIds?: string[];
}

export type EventObjectWithDefaultValues = MarkOptional<
  Required<EventObject>,
  | 'color'
  | 'borderColor'
  | 'backgroundColor'
  | 'dragBackgroundColor'
  | 'resourceId'
  | 'resourceIds'
  | 'timezone'
  | 'recurrence'
  | 'recurringExceptions'
  | 'recurringExceptionRule'
  | 'order'
  | 'dragBetweenResources'
  | 'cssClass'
  | 'meta'
  | 'allDay'
  | 'overlap'
  | 'bufferBefore'
  | 'bufferAfter'
> & {
  start: DayjsTZDate;
  end: DayjsTZDate;
  __cid: number;
};
