import { CalendarData, CalendarInfo } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';

/**
 * 添加事件到日历数据中
 * 将事件添加到事件集合并更新日期矩阵
 * @param {CalendarData} calendarData - 日历数据对象
 * @param {EventModel} event - 事件模型实例
 * @returns {EventModel} 添加的事件实例
 */
export function addEvent(events: EventObject[], event: EventObject) {
  events.push(event); // 添加到事件集合

  return event;
}

/**
 * 创建新事件
 * 根据事件数据创建事件模型并添加到日历中
 * @param {CalendarData} calendarData - 日历数据对象
 * @param {EventObject} eventData - 事件数据对象
 * @returns {EventModel} 创建的事件实例
 */
function createEvent(calendarData: CalendarData, event: EventObject) {
  return addEvent(calendarData.events, event);
}

/**
 * 批量创建事件
 * 根据事件数据数组创建多个事件
 * @param {CalendarData} calendarData - 日历数据对象
 * @param {EventObject[]} events - 事件数据数组
 * @returns {EventModel[]} 创建的事件实例数组
 */
export function createEvents(calendarData: CalendarData, events: EventObject[] = []) {
  return events.map((event) => createEvent(calendarData, event));
}
