import { isTimeEvent } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import { addMinutes, maxTime, minTime } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import array from '@/utils/array';
import { createEventCollection } from './event.controller';
import { generate3DMatrix, getCollisionGroup } from './core.controller';
import { getTopHeightByTime } from './time.controller';

// 最小高度百分比，确保事件有最小显示高度
const MIN_HEIGHT_PERCENT = 1;

/**
 * 渲染信息选项接口
 * 包含计算事件渲染位置和尺寸所需的所有参数
 */
interface RenderInfoOptions {
  baseWidth: number; // 基础宽度
  columnIndex: number; // 列索引
  renderStart: DayjsTZDate; // 渲染开始时间
  renderEnd: DayjsTZDate; // 渲染结束时间
  modelStart: DayjsTZDate; // 模型开始时间
  modelEnd: DayjsTZDate; // 模型结束时间
  goingStart: DayjsTZDate; // 前往开始时间（包含前置时间）
  comingEnd: DayjsTZDate; // 返回结束时间（包含后置时间）
  startColumnTime: DayjsTZDate; // 列开始时间
  endColumnTime: DayjsTZDate; // 列结束时间
}

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

  return uiModels;
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
  isDuplicateEvent = false,
}: {
  uiModel: EventUIModel;
  columnIndex: number;
  baseWidth: number;
  startColumnTime: DayjsTZDate;
  endColumnTime: DayjsTZDate;
  isDuplicateEvent?: boolean;
}) {
  // 如果不是重复事件且存在重复事件组，递归处理所有重复事件
  if (!isDuplicateEvent && uiModel.duplicateEvents.length > 0) {
    uiModel.duplicateEvents.forEach((event) => {
      setRenderInfo({
        uiModel: event,
        columnIndex,
        baseWidth,
        startColumnTime,
        endColumnTime,
        isDuplicateEvent: true,
      });
    });

    return;
  }

  const renderInfoOptions = getRenderInfoOptions(
    uiModel,
    columnIndex,
    baseWidth,
    startColumnTime,
    endColumnTime
  );

  // 设置事件的尺寸、内部高度和裁剪边缘信息
  setDimension(uiModel, renderInfoOptions);
  // setInnerHeights(uiModel, renderInfoOptions);
  // setCroppedEdges(uiModel, renderInfoOptions);
}

/**
 * 获取渲染信息选项
 * 根据事件模型和列信息计算渲染所需的所有参数
 *
 * 这个函数是事件渲染计算的核心，它负责：
 * 1. 提取事件的基本时间信息（开始时间、结束时间）
 * 2. 计算包含前置时间（goingDuration）和后置时间（comingDuration）的完整时间范围
 * 3. 确定事件在时间列中的实际渲染范围（与列边界取交集）
 * 4. 返回包含所有渲染计算所需参数的完整选项对象
 *
 * @param {EventUIModel} uiModel - 事件UI模型，包含事件的所有数据和状态信息
 * @param {number} columnIndex - 事件在时间列中的索引位置，用于计算水平位置
 * @param {number} baseWidth - 基础宽度（百分比），用于计算事件的宽度
 * @param {TZDate} startColumnTime - 时间列的开始时间边界
 * @param {TZDate} endColumnTime - 时间列的结束时间边界
 * @returns {RenderInfoOptions} 包含所有渲染计算所需参数的选项对象
 */
function getRenderInfoOptions(
  uiModel: EventUIModel,
  columnIndex: number,
  baseWidth: number,
  startColumnTime: DayjsTZDate,
  endColumnTime: DayjsTZDate
) {
  // 从事件模型中提取前置时间和后置时间，默认为0
  // goingDuration: 事件开始前的时间（如准备时间）
  // comingDuration: 事件结束后的时间（如清理时间）
  const { goingDuration = 0, comingDuration = 0 } = uiModel.model;

  // 获取事件的核心开始和结束时间（不包含前置和后置时间）
  const modelStart = uiModel.getStarts();
  const modelEnd = uiModel.getEnds();

  // 计算包含前置时间的实际开始时间
  // 例如：事件10:00开始，前置时间30分钟，则实际开始时间为9:30
  const goingStart = addMinutes(modelStart, -goingDuration);

  // 计算包含后置时间的实际结束时间
  // 例如：事件11:00结束，后置时间15分钟，则实际结束时间为11:15
  const comingEnd = addMinutes(modelEnd, comingDuration);

  // 计算事件在时间列中的实际渲染开始时间
  // 取事件开始时间和列开始时间的较大值，确保事件不会渲染到列边界之外
  const renderStart = maxTime(goingStart, startColumnTime);

  // 计算事件在时间列中的实际渲染结束时间
  // 取事件结束时间和列结束时间的较小值，确保事件不会渲染到列边界之外
  const renderEnd = minTime(comingEnd, endColumnTime);

  // 返回包含所有渲染计算所需参数的完整选项对象
  return {
    baseWidth, // 基础宽度，用于计算事件宽度
    columnIndex, // 列索引，用于计算事件水平位置
    modelStart, // 事件核心开始时间（不含前置时间）
    modelEnd, // 事件核心结束时间（不含后置时间）
    renderStart, // 实际渲染开始时间（与列边界取交集后）
    renderEnd, // 实际渲染结束时间（与列边界取交集后）
    goingStart, // 包含前置时间的完整开始时间
    comingEnd, // 包含后置时间的完整结束时间
    startColumnTime, // 时间列开始边界
    endColumnTime, // 时间列结束边界
    duplicateEvents: uiModel.duplicateEvents, // 重复事件组信息
  };
}

/**
 * 设置事件的尺寸信息
 * 计算事件的位置、宽度、高度等渲染属性
 */
function setDimension(uiModel: EventUIModel, options: RenderInfoOptions) {
  const { startColumnTime, endColumnTime, baseWidth, columnIndex, renderStart, renderEnd } =
    options;

  // 计算事件在时间轴上的位置和高度
  const { top, height } = getTopHeightByTime(
    renderStart,
    renderEnd,
    startColumnTime,
    endColumnTime
  );

  const dimension = {
    top,
    left: baseWidth * columnIndex, // 基于列索引计算左侧位置
    width: baseWidth,
    height: Math.max(MIN_HEIGHT_PERCENT, height), // 确保最小高度
    duplicateLeft: '',
    duplicateWidth: '',
  };

  uiModel.setUIProps(dimension);
}
