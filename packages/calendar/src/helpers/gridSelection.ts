import { useGridSelection } from '@/hooks/GridSelection/useGridSelection';
import { GridPosition } from '@/types/grid.type';
import {
  GridSelectionData,
  GridSelectionDataByRow,
  TimeGridSelectionDataByCol,
} from '@/types/gridSelection.type';
import { isBetween } from '@/utils/math';
import { isNil } from 'lodash-es';

/**
 * 从 useGridSelection hook 参数中提取必需的选择排序器参数类型
 * 只选择 selectionSorter 字段，用于类型约束
 */
type RequiredGridSelectionHookParams = Pick<
  Parameters<typeof useGridSelection>[0],
  'selectionSorter'
>;

/**
 * 网格选择辅助器接口定义
 * 包含用于排序网格选择的方法
 */
type GridSelectionHelper<
  SelectionCalculator extends (
    gridSelection: GridSelectionData | null,
    ...rest: any[]
  ) => (TimeGridSelectionDataByCol | null) | (GridSelectionDataByRow | null),
> = {
  sortSelection: RequiredGridSelectionHookParams['selectionSorter'];
  calculateSelection: SelectionCalculator;
};

/**
 * 创建排序后的网格选择对象
 * 根据起始位置和当前位置，以及是否需要反转来确定选择区域的边界
 *
 * @param initPos - 初始选择位置
 * @param currentPos - 当前选择位置
 * @param isReversed - 是否需要反转选择方向
 * @returns 排序后的选择区域对象，包含起始和结束的行列索引
 */
function createSortedGridSelection(
  initPos: GridPosition,
  currentPos: GridPosition,
  isReversed: boolean
) {
  return {
    startColumnIndex: isReversed ? currentPos.columnIndex : initPos.columnIndex,
    startRowIndex: isReversed ? currentPos.rowIndex : initPos.rowIndex,
    endColumnIndex: isReversed ? initPos.columnIndex : currentPos.columnIndex,
    endRowIndex: isReversed ? initPos.rowIndex : currentPos.rowIndex,
  };
}

/**
 * 根据当前列索引计算时间网格选择数据
 * 用于时间视图中的网格选择，处理跨列选择的情况
 *
 * 该函数的主要作用是：
 * 1. 判断当前列是否在用户选择的时间范围内
 * 2. 根据当前列在选择区域中的位置（起始列、中间列、结束列）计算该列的具体选择范围
 * 3. 处理跨列选择时的特殊逻辑，确保选择区域在视觉上连续且合理
 *
 * @param timeGridSelection - 时间网格选择数据，包含用户选择的起始和结束位置信息
 * @param columnIndex - 当前需要计算选择数据的列索引
 * @param maxRowIndex - 最大行索引（时间网格数据的最后一行索引），用于确定列的完整高度
 * @returns 当前列的选择数据，如果当前列不在选择范围内则返回 null
 */
function calculateTimeGridSelectionByCurrentIndex(
  timeGridSelection: GridSelectionData | null,
  columnIndex: number,
  maxRowIndex: number
) {
  // 如果没有选择数据，直接返回 null
  if (isNil(timeGridSelection)) {
    return null;
  }

  // 解构选择数据，获取选择区域的边界信息
  const { startColumnIndex, endColumnIndex, endRowIndex, startRowIndex } = timeGridSelection;

  // 检查当前列是否在选择范围内
  // 如果当前列索引不在起始列和结束列之间，则不在选择范围内
  if (!isBetween(columnIndex, startColumnIndex, endColumnIndex)) {
    return null;
  }

  // 判断是否为多列选择（起始列和结束列不同）
  const hasMultipleColumns = startColumnIndex !== endColumnIndex;
  // 判断当前列是否为起始列
  const isStartingColumn = columnIndex === startColumnIndex;

  // 初始化结果对象，设置基本的选择信息
  const resultGridSelection: TimeGridSelectionDataByCol = {
    startRowIndex, // 起始行索引
    endRowIndex, // 结束行索引
    isSelectingMultipleColumns: hasMultipleColumns, // 是否选择了多列
    isStartingColumn, // 当前列是否为起始列
  };

  // 处理跨列选择的特殊情况
  if (startColumnIndex < columnIndex && columnIndex < endColumnIndex) {
    // 情况1：当前列是中间列（在起始列和结束列之间）
    // 中间列应该选择整列，从第一行到最后一行
    resultGridSelection.startRowIndex = 0;
    resultGridSelection.endRowIndex = maxRowIndex;
  } else if (startColumnIndex !== endColumnIndex) {
    // 情况2：多列选择但不是中间列
    if (startColumnIndex === columnIndex) {
      // 情况2a：当前列是起始列
      // 起始列从用户选择的起始行开始，到列的最后一行结束
      resultGridSelection.endRowIndex = maxRowIndex;
    } else if (endColumnIndex === columnIndex) {
      // 情况2b：当前列是结束列
      // 结束列从第一行开始，到用户选择的结束行结束
      resultGridSelection.startRowIndex = 0;
    }
  }
  // 情况3：单列选择（startColumnIndex === endColumnIndex）
  // 这种情况下，选择范围就是用户实际选择的行范围，不需要特殊处理

  return resultGridSelection;
}

/**
 * 时间网格选择辅助器
 * 提供用于时间网格视图的选择排序功能
 */
export const timeGridSelectionHelper: GridSelectionHelper<
  typeof calculateTimeGridSelectionByCurrentIndex
> = {
  /**
   * 排序选择区域
   * 根据初始位置和当前位置，自动确定选择的方向并返回标准化的选择区域
   *
   * 选择方向判断逻辑：
   * 1. 如果初始列索引大于当前列索引，则选择方向为反向
   * 2. 如果列索引相同但初始行索引大于当前行索引，则选择方向为反向
   * 3. 其他情况为正向选择
   *
   * @param initPos - 初始选择位置
   * @param currentPos - 当前选择位置
   * @returns 标准化的选择区域对象
   */
  sortSelection: (initPos, currentPos) => {
    const isReversed =
      initPos.columnIndex > currentPos.columnIndex ||
      (initPos.columnIndex === currentPos.columnIndex && initPos.rowIndex > currentPos.rowIndex);

    return createSortedGridSelection(initPos, currentPos, isReversed);
  },
  calculateSelection: calculateTimeGridSelectionByCurrentIndex,
};
