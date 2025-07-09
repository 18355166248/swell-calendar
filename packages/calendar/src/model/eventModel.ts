import { toEndOfDay, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventCategory, EventObject } from '@/types/events.type';
import { stamp } from '@/utils/stamp';
import { EventUIModel } from './eventUIModel';
import { collidesWith } from '@/helpers/event';

export class EventModel implements EventObject {
  id = '';
  title = '';
  start: DayjsTZDate = new DayjsTZDate();
  end: DayjsTZDate = new DayjsTZDate();
  isAllday = false;
  // 事件类别：time(时间事件)、allday(全天事件)、milestone(里程碑)、task(任务)
  category: EventCategory = 'time';
  isVisible = true;
  // 是否包含多个日期
  hasMultiDates = false;
  /** 前往事件地点的行程时间（分钟） */
  goingDuration = 0;
  /** 从事件地点返回的行程时间（分钟） */
  comingDuration = 0;

  constructor(public event: EventObject) {
    stamp(this);

    this.init(event);
  }

  init({
    id = '',
    title = '',
    start = new DayjsTZDate(),
    end = new DayjsTZDate(),
    isAllday = false,
    category = 'time',
  }: EventObject) {
    this.id = id;
    this.title = title;
    this.start = start as DayjsTZDate;
    this.end = end as DayjsTZDate;
    this.isAllday = category === 'allday' || isAllday;
    this.category = category;
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
  /**
   * 计算事件的持续时间
   * @returns {number} 持续时间（毫秒，UTC时间）
   */
  duration(): number {
    const start = this.getStarts();
    const end = this.getEnds();
    let duration: number;

    if (this.isAllday) {
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
}

/**
 * 判断是否为时间事件（非全天、非多日事件）
 * 这个函数用于确定事件卡片的渲染方式
 * @param {EventUIModel} eventUI 事件UI模型
 * @returns {boolean} 如果是时间事件返回true
 */
export function isTimeEvent({ model }: EventUIModel) {
  const { category, isAllday, hasMultiDates } = model;

  // 时间事件：类别为time，非全天，非多日
  return category === 'time' && !isAllday && !hasMultiDates;
}
