import { EventModel } from '@/model/eventModel';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { Filter } from '@/types/base.type';
import { CollisionGroup, EventObject, Matrix, Matrix3d } from '@/types/events.type';
import Collection from '@/utils/collection';
import { isUndefined } from 'lodash-es';

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

/**
 * 计算事件碰撞组
 * 将重叠的事件分组，用于在日历视图中正确排列事件块
 *
 * @param {Array<EventModel|EventUIModel>} events - 事件模型或UI模型列表
 * @param {boolean} [usingTravelTime = true] - 是否考虑行程时间，默认为true
 * @returns {Array<number[]>} 碰撞组数组，每个子数组包含同一组中事件的ID
 *
 * 算法说明：
 * 1. 遍历所有事件，从第二个事件开始
 * 2. 对于每个事件，检查是否与之前的事件重叠
 * 3. 如果不重叠，创建新的碰撞组
 * 4. 如果重叠，将事件添加到包含重叠事件的碰撞组中
 */
export function getCollisionGroup<Events extends EventUIModel | EventModel>(
  events: Events[],
  usingTravelTime = true
) {
  // 二维数组 [[1,2,3],[4,5,6]]
  const collisionGroups: CollisionGroup = [];
  let previousEventList: Array<Events> = [];

  if (events.length === 0) return collisionGroups;

  // 第一个事件总是第一个碰撞组的开始
  collisionGroups[0] = [events[0].cid()];

  // 从第二个事件开始处理
  events.slice(1).forEach((event, index) => {
    // 获取当前事件之前的所有事件 (倒叙排列, 方便查找)
    previousEventList = events.slice(0, index + 1).reverse();

    // 查找与当前事件重叠的前一个事件
    const found = previousEventList.find((prevEvent) => {
      return event.collidesWith(prevEvent, usingTravelTime);
    });
    if (!found) {
      // 如果未找到重叠事件，创建新的碰撞组
      collisionGroups.push([event.cid()]);
    } else {
      // 如果找到重叠事件，将当前事件添加到对应的碰撞组中
      collisionGroups
        .slice()
        .reverse()
        .some((group) => {
          // 如果找到重叠事件，将当前事件添加到对应的碰撞组中
          if (~group.indexOf(found.cid())) {
            group.push(event.cid());
            return true; // 找到重叠事件，停止查找
          }
          return false;
        });
    }
  });

  return collisionGroups;
}

/**
 * 获取矩阵中指定列的最后一个非空行索引
 * 用于在矩阵布局算法中确定事件应该放置的行位置
 *
 * @param {array[]} matrix - 二维矩阵，matrix[row][col] 结构
 * @param {number} col - 要检查的列索引
 * @returns {number} 该列中最后一个非空行的索引，如果列为空则返回-1
 *
 * 算法说明：
 * 1. 从矩阵的最后一行开始向上遍历
 * 2. 检查指定列中每一行是否有值（非undefined）
 * 3. 返回第一个找到非空值的行索引
 * 4. 如果整列都为空，返回-1
 *
 * 用途：
 * - 在事件布局中，确定当前列可以放置新事件的位置
 * - 避免事件重叠，确保垂直方向上的合理排列
 *
 * 示例：
 * matrix = [
 *   [A, B, C],
 *   [D, undefined, E],
 *   [F, G, undefined]
 * ]
 * getLastRowInColumn(matrix, 0) => 2 (F在最后一行)
 * getLastRowInColumn(matrix, 1) => 2 (G在最后一行)
 * getLastRowInColumn(matrix, 2) => 1 (E在倒数第二行)
 */
export function getLastRowInColumn(matrix: Array<any[]>, col: number) {
  let { length: row } = matrix;

  while (row > 0) {
    row--;
    if (!isUndefined(matrix[row][col])) {
      return row;
    }
  }

  return -1;
}

/**
 * 计算事件块的矩阵布局
 * 根据碰撞组信息，为每个事件分配在矩阵中的位置，实现日历视图中事件块的合理排列
 *
 * @param {Collection<T>} collection - 事件模型集合，包含所有需要布局的事件
 * @param {CollisionGroup} collisionGroups - 碰撞组数组，每个子数组包含同一时间段内重叠的事件ID
 * @param {boolean} [usingTravelTime = true] - 是否考虑行程时间，影响事件重叠判断
 * @returns {Matrix3d<T>} 三维矩阵数组，每个子矩阵代表一个碰撞组的二维布局
 *
 * 算法详细说明：
 * 1. 遍历每个碰撞组，为每个组创建一个独立的二维矩阵
 * 2. 对于组内每个事件，从左到右（列）寻找合适的位置：
 *    - 如果当前列没有事件，直接放在第一行
 *    - 如果当前列有事件但不重叠，放在该列的下一行
 *    - 如果重叠，尝试下一列，直到找到合适位置
 * 3. 矩阵结构：matrix[row][col] = event，其中：
 *    - row: 垂直位置（从上到下）
 *    - col: 水平位置（从左到右）
 *    - event: 事件对象
 *
 * 布局策略：
 * - 优先填充左侧列，减少水平空间占用
 * - 同一列中的事件按时间顺序垂直排列
 * - 重叠事件通过增加列数来避免冲突
 *
 * 示例：
 * 假设有3个重叠事件A、B、C，可能的布局：
 * 矩阵1: [[A], [B], [C]]  (垂直排列)
 * 矩阵2: [[A, B], [C]]    (A、B水平排列，C在下一行)
 * 矩阵3: [[A], [B, C]]    (A单独一行，B、C水平排列)
 */
export function generate3DMatrix<T extends EventUIModel | EventModel>(
  collection: Collection<T>,
  collisionGroups: CollisionGroup,
  usingTravelTime = true
): Matrix3d<T> {
  const matrix3D: Matrix3d<T> = [];

  // 遍历每个碰撞组
  collisionGroups.forEach((group) => {
    // 创建新的矩阵
    const matrixRow: Matrix<T> = [[]];
    // 为组内每个事件分配位置
    group.forEach((eventId) => {
      const event = collection.get(eventId) as T;
      let col = 0; // 当前尝试的列索引
      let found = false; // 是否找到合适位置的标志
      let nextRow; // 下一行的索引
      let lastRowInColumn; // 当前列的最后一行索引

      // 从左到右逐列寻找合适的位置，直到找到不重叠的位置
      while (!found) {
        // 获取当前列中最后一个非空行的索引
        lastRowInColumn = getLastRowInColumn(matrixRow, col);

        if (lastRowInColumn === -1) {
          // 情况1：当前列完全没有事件，直接放在第一行
          matrixRow[0].push(event);
          found = true;
        } else if (!event.collidesWith(matrixRow[lastRowInColumn][col], usingTravelTime)) {
          // 情况2：当前列有事件，但当前事件与最后一个事件不重叠
          // 将事件放在该列的下一行
          nextRow = lastRowInColumn + 1;
          // 如果下一行不存在, 创建新行
          if (isUndefined(matrixRow[nextRow])) {
            matrixRow[nextRow] = [];
          }
          // 将事件放在该列的下一行
          matrixRow[nextRow][col] = event;
          found = true;
        }

        // 情况3：当前位置不合适（与现有事件重叠），尝试下一列
        col++;
      }
    });
    // 将当前碰撞组的二维矩阵添加到三维矩阵中
    matrix3D.push(matrixRow);
  });

  return matrix3D;
}
