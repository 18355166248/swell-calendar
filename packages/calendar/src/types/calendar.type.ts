import { EventObject } from './events.type';

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

export type CalendarSlice = {
  calendar: {
    calendars: CalendarInfo[];
    events: EventObject[];
    createEvents: (events: EventObject[]) => void;
  };
};
