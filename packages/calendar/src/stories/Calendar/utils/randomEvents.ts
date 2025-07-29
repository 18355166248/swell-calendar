// 导入必要的依赖
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventCategory, EventObject } from '@/types/events.type';
import Chance from 'chance';
import dayjs from 'dayjs';

// 创建随机数生成器实例
const chance = new Chance();
// 定义事件类别数组，用于随机选择事件类型
const EVENT_CATEGORY: EventCategory[] = ['milestone', 'task'];
// 事件ID计数器，用于生成唯一的事件ID
let id = 1;

/**
 * 为事件设置时间属性
 * @param event 事件对象
 * @param start 开始时间范围
 * @param end 结束时间范围
 */
function createTime(event: EventObject, start: DayjsTZDate, end: DayjsTZDate) {
  // 将时间转换为dayjs对象以便操作
  let startDate = dayjs(start.getTime());
  let endDate = dayjs(end.getTime());
  // 计算时间范围内的天数差
  const diffDate = endDate.diff(startDate, 'days');

  // 30%的概率创建全天事件
  event.isAllday = chance.bool({ likelihood: 30 });

  // 根据事件类型设置类别
  if (event.isAllday) {
    event.category = 'allday';
  } else if (chance.bool({ likelihood: 30 })) {
    // 30%的概率设置为里程碑或任务类型
    event.category = EVENT_CATEGORY[chance.integer({ min: 0, max: 1 })];
  } else {
    // 默认为时间事件
    event.category = 'time';
  }

  // 随机设置开始时间
  startDate = startDate.add(chance.integer({ min: 0, max: diffDate }), 'days');
  startDate = startDate.hour(chance.integer({ min: 0, max: 23 }));
  startDate = startDate.minute(chance.bool() ? 0 : 30); // 随机选择整点或半点
  event.start = startDate.toDate();

  // 设置结束时间
  endDate = dayjs(startDate);
  if (event.isAllday) {
    // 全天事件持续0-3天
    endDate = endDate.add(chance.integer({ min: 0, max: 3 }), 'days');
  }
  // 事件持续1-4小时
  event.end = endDate.add(chance.integer({ min: 1, max: 4 }), 'hour').toDate();
}

/**
 * 创建随机事件对象
 * @param start 开始时间范围
 * @param end 结束时间范围
 * @returns 随机生成的事件对象
 */
function createRandomEvent({ start, end }: { start: DayjsTZDate; end: DayjsTZDate }): EventObject {
  // 创建基础事件对象
  const event: EventObject = {
    id: `event-${id++}`, // 生成唯一的事件ID
    title: chance.sentence({ words: 4 }), // 生成4个单词的随机标题
    category: 'time', // 默认类别
    backgroundColor: chance.color({ format: 'hex' }), // 随机背景色
    dragBackgroundColor: chance.color({ format: 'hex' }), // 拖拽时的背景色
    borderColor: chance.color({ format: 'hex' }), // 边框颜色
    color: chance.color({ format: 'hex' }), // 文字颜色
  };

  // 设置事件的时间属性
  createTime(event, start, end);

  return event;
}

/**
 * 创建指定数量的随机事件
 * @param start 开始时间范围
 * @param end 结束时间范围
 * @param count 要创建的事件数量
 * @returns 随机事件数组
 */
export function createRandomEvents(
  start: DayjsTZDate,
  end: DayjsTZDate,
  count: number
): EventObject[] {
  // 使用Array.from创建指定数量的随机事件
  return Array.from({ length: count }, () => createRandomEvent({ start, end }));
}
