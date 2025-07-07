import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { MouseEvent, KeyboardEvent } from 'react';

export type Matrix<T> = T[][];
export type Matrix3d<T> = Matrix<T>[];

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

/**
 * 事件对象接口 - 定义日历事件的基本属性和结构
 *
 * 这个接口描述了日历组件中事件的所有可能属性。
 * 所有属性都是可选的，允许灵活的事件数据配置。
 */
export interface EventObject {
  id?: string; // 事件唯一标识符
  title?: string; // 事件标题
  start?: DateType; // 事件开始时间
  end?: DateType; // 事件结束时间
  isAllday?: boolean; // 是否为全天事件
  /**
   * 事件类别
   * 定义事件的类型，影响事件在日历中的显示方式
   * 可选值：'milestone'(里程碑)、'task'(任务)、'allday'(全天)、'time'(时间事件)
   */
  category?: EventCategory;
  isVisible?: boolean; // 是否可见
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any; // 原始数据
}
