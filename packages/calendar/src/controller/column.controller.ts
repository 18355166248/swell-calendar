import { EventUIModel } from '@/model/eventUIModel';
import { addMinutes } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';

/**
 * 事件过滤器：获取指定日期范围内的事件
 * @param {TZDate} startColumnTime - 开始日期
 * @param {TZDate} endColumnTime - 结束日期
 * @returns {function} 事件过滤函数
 */
export function isBetweenColumn(startColumnTime: DayjsTZDate, endColumnTime: DayjsTZDate) {
  return (uiModel: EventUIModel) => {
    const { goingDuration = 0, comingDuration = 0 } = uiModel.model;
    // 计算包含前置和后置时间的实际开始和结束时间
    const ownStarts = addMinutes(uiModel.getStarts(), -goingDuration);
    const ownEnds = addMinutes(uiModel.getEnds(), comingDuration);

    // 返回事件是否在指定时间范围内
    return !(ownEnds <= startColumnTime || ownStarts >= endColumnTime);
  };
}
