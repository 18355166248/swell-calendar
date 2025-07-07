import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { Filter } from '@/types/base.type';
import { EventObject } from '@/types/events.type';
import Collection from '@/utils/collection';

/* 创建日期范围过滤器
 * 用于筛选在指定日期范围内的事件
 *
 * @param {TZDate} start - 开始日期
 * @param {TZDate} end - 结束日期
 * @returns {function} 返回一个过滤函数，用于判断事件是否在指定日期范围内
 *
 * 过滤逻辑：
 * 事件与日期范围有交集的条件：
 * - 事件开始时间 >= 范围开始时间 且 事件结束时间 <= 范围结束时间（完全包含）
 * - 事件开始时间 < 范围开始时间 且 事件结束时间 >= 范围开始时间（左重叠）
 * - 事件结束时间 > 范围结束时间 且 事件开始时间 <= 范围结束时间（右重叠）
 *
 * 简化为：!(事件结束时间 < 范围开始时间 || 事件开始时间 > 范围结束时间)
 */
export function getEventInDateRangeFilter(
  start: DayjsTZDate,
  end: DayjsTZDate
): Filter<EventObject> {
  return (event) => {
    const ownStarts = event.start!;
    const ownEnds = event.end!;

    // 检查事件是否与日期范围有交集
    // 等价于：
    // (ownStarts >= start && ownEnds <= end) ||  // 完全包含
    // (ownStarts < start && ownEnds >= start) || // 左重叠
    // (ownEnds > end && ownStarts <= end)        // 右重叠
    return !(ownEnds < start || ownStarts > end);
  };
}

/**
 * 将事件模型集合转换为UI模型集合
 * 为每个事件模型创建对应的UI模型
 *
 * @param {Collection} eventCollection - 事件模型集合
 * @returns {Collection} UI模型集合
 */
export function convertToUIModel(eventCollection: Collection<EventModel>) {
  // 创建新的UI模型集合，使用cid作为唯一标识符
  const uiModelColl = new Collection<EventUIModel>((uiModel) => uiModel.cid());

  // 遍历事件集合，为每个事件创建对应的UI模型
  eventCollection.each((eventModel) => {
    uiModelColl.add(new EventUIModel(eventModel));
  });

  return uiModelColl;
}
