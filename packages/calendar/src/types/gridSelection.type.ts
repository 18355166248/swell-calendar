/**
 * 网格选择数据接口
 * 用于表示在日历网格中选择的矩形区域
 */
export interface GridSelectionData {
  /** 起始行索引 */
  startRowIndex: number;
  /** 结束行索引 */
  endRowIndex: number;
  /** 起始列索引 */
  startColumnIndex: number;
  /** 结束列索引 */
  endColumnIndex: number;
}

/**
 * 网格选择状态类型
 * 管理不同视图模式下的网格选择状态
 */
export type GridSelectionState = {
  /** 月视图网格选择数据 */
  dayGridMonth: GridSelectionData | null;
  /** 周视图网格选择数据 */
  dayGridWeek: GridSelectionData | null;
  /** 时间网格选择数据 */
  timeGrid: GridSelectionData | null;
  /** 累积选择数据 */
  accumulated: {
    /** 月视图累积选择数据数组 */
    dayGridMonth: GridSelectionData[] | [];
  };
};

/** 网格选择类型 */
export type GridSelectionType = Exclude<keyof GridSelectionState, 'accumulated'>;

export type GridSelectionDispatch = {
  clearAll: () => void;
  setGridSelection: (type: GridSelectionType, gridSelection: GridSelectionData) => void;
};

/**
 * 网格选择切片类型
 * 用于 Redux/Zustand 状态管理中的网格选择模块
 */
export type GridSelectionSlice = {
  /** 网格选择状态 */
  gridSelection: GridSelectionState & GridSelectionDispatch;
};

/**
 * 按行选择的网格数据接口
 * 用于表示在单行中选择的单元格范围
 */
export interface GridSelectionDataByRow {
  /** 起始单元格索引 */
  startCellIndex: number;
  /** 结束单元格索引 */
  endCellIndex: number;
}

/**
 * 时间网格按列选择数据接口
 * 用于表示在时间网格中按列选择的数据
 */
export interface TimeGridSelectionDataByCol {
  /** 起始行索引 */
  startRowIndex: number;
  /** 结束行索引 */
  endRowIndex: number;
  /** 是否为起始列 */
  isStartingColumn: boolean;
  /** 是否正在选择多列 */
  isSelectingMultipleColumns: boolean;
}
