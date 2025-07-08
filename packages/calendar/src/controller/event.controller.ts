import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { makeDateRange, MS_PER_DAY, toEndOfDay, toStartOfDay } from '@/time/datetime';
import { CalendarData } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';
import Collection from '@/utils/collection';

// 创建事件集合
export function createEventCollection<T extends EventModel | EventUIModel>(...initItems: T[]) {
  const collection = new Collection<T>((event) => event.cid());
  if (initItems) {
    collection.add(...initItems);
  }
  return collection;
}

/**
 * 判断事件是否为全天事件
 * 全天事件的条件：
 * 1. 明确标记为全天事件
 * 2. 时间类别事件且持续时间超过一天
 * @param {EventModel} event - 事件模型实例
 * @returns {boolean} 是否为全天事件
 */
export function isAllday(event: EventModel) {
  return (
    event.isAllday ||
    (event.category === 'time' && Number(event.end) - Number(event.start) > MS_PER_DAY)
  );
}

/**
 * 根据事件类别进行分组过滤
 * 用于将事件按类型分组显示（全天事件、时间事件等）
 * @param {EventUIModel} uiModel - UI模型实例
 * @returns {string} 分组键名
 */
export function filterByCategory(uiModel: EventUIModel) {
  const { model } = uiModel;

  // 如果是全天事件，返回'allday'分组
  if (isAllday(model)) {
    return 'allday';
  }

  // 否则返回事件的原始类别
  return model.category;
}

/**
 * 将事件添加到日期矩阵中
 * 日期矩阵用于快速查找特定日期的事件
 * @param {IDS_OF_DAY} idsOfDay - 日期ID映射对象
 * @param {EventModel} event - 事件模型实例
 */
function addToMatrix(idsOfDay: Record<string, number[]>, event: EventModel) {
  // 获取事件包含的所有日期
  const containDates = getDateRange(event.getStarts(), event.getEnds());

  // 为每个包含的日期添加事件 ID
  containDates.forEach((date) => {
    const dateStr = date.dayjs.format('YYYYMMDD');
    const matrix = (idsOfDay[dateStr] = idsOfDay[dateStr] || []);
    matrix.push(event.cid());
  });
}

/**
 * 添加事件到日历数据中
 * 将事件添加到事件集合并更新日期矩阵
 * @param {CalendarData} calendarData - 日历数据对象
 * @param {EventModel} event - 事件模型实例
 * @returns {EventModel} 添加的事件实例
 */
export function addEvent(calendarData: CalendarData, event: EventModel) {
  calendarData.events.add(event); // 添加到事件集合
  addToMatrix(calendarData.idsOfDay, event); // 更新日期矩阵

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
  const eventModel = new EventModel(event);
  return addEvent(calendarData, eventModel);
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

/**
 * 计算事件包含的日期范围
 * 根据开始和结束日期生成该范围内的所有日期
 * @param {DayjsTZDate} start - 范围的开始日期
 * @param {DayjsTZDate} end - 范围的结束日期
 * @returns {DayjsTZDate[]} 包含的日期数组
 */
export function getDateRange(start: DayjsTZDate, end: DayjsTZDate) {
  return makeDateRange(toStartOfDay(start), toEndOfDay(end), MS_PER_DAY);
}
