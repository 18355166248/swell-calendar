import { useGridSelection } from '@/hooks/GridSelection/useGridSelection';
import { GridPosition } from '@/types/grid.type';

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
type GridSelectionHelper = {
  sortSelection: RequiredGridSelectionHookParams['selectionSorter'];
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
 * 时间网格选择辅助器
 * 提供用于时间网格视图的选择排序功能
 */
export const timeGridSelectionHelper: GridSelectionHelper = {
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
};
