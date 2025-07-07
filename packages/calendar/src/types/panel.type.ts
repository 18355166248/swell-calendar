/**
 * 全天事件类别类型
 * - milestone: 里程碑事件
 * - allday: 全天事件
 * - task: 任务事件
 */
export type AlldayEventCategory = 'milestone' | 'allday' | 'task';

/**
 * 面板类型
 * - daygrid: 日网格面板（用于月视图、周视图等）
 * - timegrid: 时间网格面板（用于日视图、时间轴视图等）
 */
export type PanelType = 'daygrid' | 'timegrid';

/**
 * 面板配置接口
 * 定义日历中各个面板的配置选项
 */
export interface Panel {
  /** 面板名称，用于标识不同的面板 */
  name: string;
  /** 面板类型，决定面板的渲染方式 */
  type: PanelType;
  /** 面板最小高度（像素） */
  minHeight?: number;
  /** 面板最大高度（像素） */
  maxHeight?: number;
  /** 是否显示展开按钮，允许用户展开/收起面板 */
  showExpandableButton?: boolean;
  /** 面板展开时的最大高度（像素） */
  maxExpandableHeight?: number;
  /** 面板支持的事件处理器类型 */
  handlers?: ['click', 'creation', 'move', 'resize'];
  /** 是否显示该面板 */
  show?: boolean;
}
