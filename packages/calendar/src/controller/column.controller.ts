import { isTimeEvent } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import { addMinutes } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import array from '@/utils/array';
import { createEventCollection } from './event.controller';
import { generate3DMatrix, getCollisionGroup } from './core.controller';

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

/**
 * 转换事件为EventUIModel并设置渲染信息
 * 这是主要的入口函数，处理事件列表的渲染信息计算
 * @param {EventUIModel[]} events - 事件列表
 * @param {TZDate} startColumnTime - 开始日期
 * @param {TZDate} endColumnTime - 结束日期
 */
export function setRenderInfoOfUIModels(
  events: EventUIModel[],
  startColumnTime: DayjsTZDate,
  endColumnTime: DayjsTZDate
) {
  // 过滤时间事件并按开始时间排序
  const uiModels = events
    .filter(isTimeEvent)
    .filter(isBetweenColumn(startColumnTime, endColumnTime))
    .sort(array.compare.num.asc);

  const collections = createEventCollection(...uiModels);
  const usingTravelTime = true;
  const collisionGroups = getCollisionGroup(uiModels, usingTravelTime);
  const matrices3D = generate3DMatrix(collections, collisionGroups, usingTravelTime);
  matrices3D.forEach((matrices) => {
    // console.log('🚀 ~ matrix:', matrices);
    const maxRowLength = Math.max(...matrices.map((matrix) => matrix.length));
    const baseWidth = Math.round(100 / maxRowLength);
    matrices.forEach((row) => {
      row.forEach((uiModel, index) => {
        setRenderInfo({
          uiModel,
          columnIndex: index,
          baseWidth,
          startColumnTime,
          endColumnTime,
        });
      });
    });
  });
}

/**
 * 设置单个事件的渲染信息
 * 递归处理重复事件，为每个事件设置完整的渲染属性
 */
function setRenderInfo({
  uiModel,
  columnIndex,
  baseWidth,
  startColumnTime,
  endColumnTime,
}: {
  uiModel: EventUIModel;
  columnIndex: number;
  baseWidth: number;
  startColumnTime: DayjsTZDate;
  endColumnTime: DayjsTZDate;
}) {}
