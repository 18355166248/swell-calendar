import { CalendarInfo } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';

/**
 * 创建新事件
 * 根据事件数据创建事件模型并添加到日历中
 * @param {CalendarData} calendarData - 日历数据对象
 * @param {EventObject} eventData - 事件数据对象
 * @returns {EventModel} 创建的事件实例
 */
function createEvent(calendars: CalendarInfo[], event: EventObject) {
  return {
    ...event,
    calendar: calendars.find((calendar) => calendar.id === event.calendarId),
  };
}

/**
 * 批量创建事件
 * 根据事件数据数组创建多个事件
 * @param {CalendarData} calendarData - 日历数据对象
 * @param {EventObject[]} events - 事件数据数组
 * @returns {EventModel[]} 创建的事件实例数组
 */
export function createEvents(calendars: CalendarInfo[], events: EventObject[] = []) {
  return events.map((event) => createEvent(calendars, event));
}
