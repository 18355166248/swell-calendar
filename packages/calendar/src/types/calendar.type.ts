import Collection from '@/utils/collection';
import { EventObject } from './events.type';
import { EventModel } from '@/model/eventModel';

/**
 * 日历颜色接口
 */
export interface CalendarColor {
  // 文本颜色
  color?: string;
  // 背景颜色
  backgroundColor?: string;
  // 拖拽时的背景颜色
  dragBackgroundColor?: string;
  // 边框颜色
  borderColor?: string;
}

/**
 * 日历信息接口，继承自CalendarColor
 */
export interface CalendarInfo extends CalendarColor {
  // 日历唯一标识符
  id: string;
  // 日历名称
  name: string;
}

export interface CalendarData {
  calendars: CalendarInfo[];
  events: Collection<EventModel>;
}

export type CalendarSlice = {
  calendar: CalendarData & {
    createEvents: (events: EventObject[]) => void;
  };
};
