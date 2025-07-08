import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { WeekOptions } from '@/types/options.type';
import { Panel } from '@/types/panel.type';
import {
  convertToUIModel,
  generate3DMatrix,
  getCollisionGroup,
  getEventInDateRangeFilter,
} from './core.controller';
import { EventGroupMap, Matrix3d } from '@/types/events.type';
import Collection from '@/utils/collection';
import { EventUIModel } from '@/model/eventUIModel';
import { filterByCategory, getDateRange } from './event.controller';
import { isNil } from 'lodash-es';
import { EventModel } from '@/model/eventModel';
import array from '@/utils/array';

function getUIModelForAlldayView(start: DayjsTZDate, end: DayjsTZDate) {
  return [];
}

/**
 * 按日期范围分割事件模型集合
 *
 * 该函数将事件集合按日期进行分组，每个日期对应一个事件集合。
 * 主要用于时间视图的事件渲染，确保每天的事件能够正确显示在对应的列中。
 *
 * @param {IDS_OF_DAY} idsOfDay - 日期索引映射，键为YYYYMMDD格式的日期字符串，值为该日期的事件ID数组
 * @param {TZDate} start - 日期范围的开始日期
 * @param {TZDate} end - 日期范围的结束日期
 * @param {Collection<EventModel | EventUIModel>} uiModelColl - 要分割的事件模型集合
 * @returns {Record<string, Collection>} 按日期分组的事件集合映射，键为YYYYMMDD格式的日期字符串
 */
export function splitEventByDateRange(
  idsOfDay: Record<string, number[]>,
  start: DayjsTZDate,
  end: DayjsTZDate,
  uiModelTimeColl: Collection<EventUIModel> | Collection<EventModel>
) {
  const result: Record<string, Collection<EventModel | EventUIModel>> = {};

  const range = getDateRange(start, end);

  range.forEach((date) => {
    // 将日期格式化为YYYYMMDD字符串，用作结果对象的键
    const dateStr = date.dayjs.format('YYYYMMDD');
    // 从日期索引中获取该日期的事件ID数组
    const ids = idsOfDay[dateStr];

    // 为该日期创建一个新的事件集合，使用事件ID作为唯一标识
    const collection = (result[dateStr] = new Collection<EventModel | EventUIModel>((event) =>
      event.cid()
    ));

    // 如果该日期有事件，则将对应的事件添加到该日期的集合中
    if (ids && ids.length > 0) {
      ids.forEach((id) => {
        uiModelTimeColl.doWhenHas(id, (event) => {
          collection.add(event);
        });
      });
    }
  });

  return result;
}

/**
 * 创建时间视图的UI模型处理函数
 *
 * 根据时间视图的显示小时范围配置，返回相应的UI模型处理函数。
 * 如果显示范围是全天（0-24小时），则只进行排序；否则会先过滤再排序。
 *
 * @param {number} hourStart - 时间视图显示的开始小时（0-23）
 * @param {number} hourEnd - 时间视图显示的结束小时（0-23）
 * @returns {function} 返回一个函数，接受UI模型集合，返回处理后的UI模型数组
 */
export function _makeGetUIModelFuncForTimeView(
  hourStart: number,
  hourEnd: number
): (uiModelColl: Collection<EventUIModel>) => EventUIModel[] {
  if (hourStart === 0 && hourEnd === 24) {
    return (uiModelColl: Collection<EventUIModel>) => {
      return uiModelColl.sort(array.compare.event.asc);
    };
  }

  return (uiModelColl: Collection<EventUIModel>) => {
    return uiModelColl.toArray();
  };
}
/**
 * 为时间视图部分创建UI模型矩阵
 *
 * 该函数处理时间视图的事件渲染，包括：
 * 1. 按日期分割事件集合
 * 2. 根据小时范围过滤事件
 * 3. 处理事件碰撞检测和布局
 * 4. 生成3D矩阵用于渲染
 *
 * @param {IDS_OF_DAY} idsOfDay - 日期索引映射，用于快速查找特定日期的事件
 * @param {object} condition - 查找条件对象
 *  @param {TZDate} condition.start - 开始日期
 *  @param {TZDate} condition.end - 结束日期
 *  @param {Collection<EventUIModel>} condition.uiModelTimeColl - 时间事件UI模型集合
 *  @param {number} condition.hourStart - 显示的开始小时（0-23）
 *  @param {number} condition.hourEnd - 显示的结束小时（0-23）
 * @returns {Record<string, Matrix3d<EventUIModel>>} 按日期分组的3D事件矩阵，键为YYYYMMDD格式的日期字符串
 */
function getUIModelForTimeView(
  idsOfDay: Record<string, number[]>,
  condition: {
    start: DayjsTZDate;
    end: DayjsTZDate;
    uiModelTimeColl: Collection<EventUIModel>;
    hourStart: number;
    hourEnd: number;
  }
) {
  const { start, end, uiModelTimeColl, hourStart, hourEnd } = condition;

  // 按日期范围分隔事件集合
  const ymdSplitted = splitEventByDateRange(idsOfDay, start, end, uiModelTimeColl);

  // 初始化结果对象，用于存储每天的3D事件矩阵
  const result: Record<string, Matrix3d<EventUIModel>> = {};

  // 创建UI模型处理函数（包含小时范围过滤和排序）
  const _getUIModel = _makeGetUIModelFuncForTimeView(hourStart, hourEnd);

  // 启用旅行时间计算（用于更精确的碰撞检测）
  const usingTravelTime = true;

  // 遍历每天的事件集合，生成对应的3D矩阵
  Object.entries(ymdSplitted).forEach(([dateStr, uiModelColl]) => {
    // 处理当天的UI模型（过滤、排序）
    const uiModels = _getUIModel(uiModelColl as Collection<EventUIModel>);

    // 计算事件碰撞组（用于处理重叠事件的布局）
    const collisionGroups = getCollisionGroup(uiModels, usingTravelTime);

    // 生成3D矩阵
    const matrix = generate3DMatrix(uiModelColl, collisionGroups, usingTravelTime);

    // 将3D矩阵添加到结果对象中
    result[dateStr] = matrix as Matrix3d<EventUIModel>;
  });

  return result;
}

/**
 * 在指定日期范围内查找并组织事件数据，用于日/周视图的渲染
 *
 * 该函数是周视图的核心控制器，负责：
 * 1. 根据日期范围过滤事件
 * 2. 将事件按类型分组（里程碑、任务、全天事件、时间事件）
 * 3. 为不同类型的事件生成相应的UI模型矩阵
 * 4. 处理时间视图的小时范围限制
 *
 * @param {CalendarData} calendarData - 日历数据存储对象，包含所有事件数据和日期索引
 * @param {object} condition - 查找条件对象
 *  @param {TZDate} condition.start - 查询的开始日期（包含）
 *  @param {TZDate} condition.end - 查询的结束日期（包含）
 *  @param {Array.<Panel>} condition.panels - 事件面板配置数组，定义要处理的事件类型
 *    支持的panel类型：
 *    - 'milestone': 里程碑事件
 *    - 'task': 任务事件
 *    - 'allday': 全天事件
 *    - 'time': 时间事件
 *  @param {WeekOptions} condition.options - 周视图的配置选项
 *    - hourStart: 时间视图显示的开始小时（默认0）
 *    - hourEnd: 时间视图显示的结束小时（默认24）
 *
 * @returns {EventGroupMap} 按事件类型分组的事件UI模型映射对象
 *  返回结构：
 *  {
 *    milestone: [], // 里程碑事件矩阵
 *    task: [],      // 任务事件矩阵
 *    allday: [],    // 全天事件矩阵
 *    time: {}       // 时间事件矩阵（按日期分组）
 *  }
 */
export function findByDateRange(
  calendar: CalendarData,
  params: {
    start: DayjsTZDate;
    end: DayjsTZDate;
    panels: Panel[];
    options: WeekOptions;
  }
) {
  const { start, end, panels, options } = params;

  const { events, idsOfDay } = calendar;
  const hourStart = options.hourStart || 0; // 默认从0点开始
  const hourEnd = options.hourEnd || 24; // 默认到24点结束

  // 创建过滤函数
  const filterFn = Collection.and(getEventInDateRangeFilter(start, end));

  // 过滤事件并转换为UI模型
  const uiModelColl = convertToUIModel(events.filter(filterFn));

  // 按事件类别（milestone、task、allday、time）分组
  const group: Record<string, Collection<EventUIModel>> = uiModelColl.groupBy(filterByCategory);

  return panels.reduce<EventGroupMap>(
    (acc, cur) => {
      const { name, type } = cur;

      // 如果该类型的事件不存在，跳过处理
      if (isNil(group[name])) {
        return acc;
      }

      return {
        ...acc,
        [name]:
          type === 'daygrid'
            ? getUIModelForAlldayView(start, end)
            : getUIModelForTimeView(idsOfDay, {
                start,
                end,
                uiModelTimeColl: group[name],
                hourStart,
                hourEnd,
              }),
      };
    },
    {
      milestone: [], // 里程碑事件矩阵
      task: [], // 任务事件矩阵
      allday: [], // 全天事件矩阵
      time: {}, // 时间事件矩阵（按日期分组）
    }
  );
}
