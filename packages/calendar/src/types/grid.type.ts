import type { ClientMousePosition } from '@/types/mouse.type';
import type { FormattedTimeString } from '@/types/datetime.type';
import DayjsTZDate from '@/time/dayjs-tzdate';

/**
 * 网格UI模型接口
 * 用于描述网格中单个单元格的UI属性
 */
export interface GridUIModel {
  /** 日期（1-31） */
  day: number;
  /** 单元格宽度（像素） */
  width: number;
  /** 单元格左侧位置（像素） */
  left: number;
}

/**
 * 网格位置接口
 * 用于表示网格中的行列坐标
 */
export interface GridPosition {
  /** 列索引（从0开始） */
  columnIndex: number;
  /** 行索引（从0开始） */
  rowIndex: number;
}

/**
 * 通用网格列接口
 * 用于描述时间网格中的列信息
 */
export interface CommonGridColumn {
  /** 该列对应的日期 */
  date: DayjsTZDate;
  /** 列左侧位置（像素） */
  left: number;
  /** 列宽度（像素） */
  width: number;
}

/**
 * 时间网格行接口
 * 用于描述时间网格中的行信息
 */
export interface TimeGridRow {
  /** 行顶部位置（像素） */
  top: number;
  /** 行高度（像素） */
  height: number;
  /** 行开始时间（格式化字符串） */
  startTime: FormattedTimeString;
  /** 行结束时间（格式化字符串） */
  endTime: FormattedTimeString;
}

/**
 * 时间网格数据接口
 * 包含完整的时间网格数据结构
 */
export interface TimeGridData {
  /** 时间网格的所有行数据 */
  rows: TimeGridRow[];
  /** 时间网格的所有列数据 */
  columns: CommonGridColumn[];
}

/**
 * 网格位置查找器类型
 * 根据鼠标位置查找对应的网格位置
 * @param mousePosition 鼠标客户端位置
 * @returns 网格位置或null（如果未找到）
 */
export type GridPositionFinder = (mousePosition: ClientMousePosition) => GridPosition | null;
