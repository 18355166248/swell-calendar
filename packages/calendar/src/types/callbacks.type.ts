import DayjsTZDate from '@/time/dayjs-tzdate';

import { EventObject, EventObjectWithDefaultValues } from './events.type';
import { ViewType } from './options.type';

export interface CalendarPageChangeInfo {
  view: ViewType;
  date: DayjsTZDate;
}

export interface CalendarEventClickInfo {
  event: EventObjectWithDefaultValues;
}

export interface CalendarRangeSelectInfo {
  view: ViewType;
  start: DayjsTZDate;
  end: DayjsTZDate;
  resourceId?: string;
  resourceIds?: string[];
  resourceNames?: string[];
}

export type CalendarCellClickInfo = CalendarRangeSelectInfo;

export interface CalendarEventCreateInfo {
  event: EventObject;
}

/**
 * 重复事件编辑作用域
 *
 * - `'single'`：仅修改本次发生（生成 RecurringException override）
 * - `'following'`：修改本次及以后所有发生（截断原规则 + 创建新规则）
 * - `'all'`：修改整个系列（直接修改父事件）
 */
export type CalendarRecurrenceEditScope = 'single' | 'following' | 'all';

/**
 * 重复事件实例标识信息
 *
 * 当事件是 recurrence 展开的实例时，回调 payload 中携带此信息，
 * 使宿主能识别实例身份并选择编辑作用域。
 */
export interface CalendarRecurrenceInstanceInfo {
  /** 父事件 ID（即展开前原始事件的 id） */
  recurrenceParentId: string;
  /** 本次发生的原始日期 */
  recurrenceOccurrenceDate: DayjsTZDate;
}

export interface CalendarEventUpdateInfo {
  event: EventObject;
  previousEvent: EventObjectWithDefaultValues;
  /**
   * 仅当事件为 recurrence 展开实例时存在。
   *
   * 携带父事件 ID 和原始发生日期，宿主可据此选择编辑作用域
   * （本次 / 本次及以后 / 全部），并使用 `applyRecurrenceEditScope()`
   * 工具函数完成数据变更。
   */
  recurrenceInstance?: CalendarRecurrenceInstanceInfo;
}

export interface CalendarEventHoverInfo {
  event: EventObjectWithDefaultValues;
  hovering: boolean;
}

export type CalendarEventChangeAction = 'create' | 'move' | 'resize' | 'delete';

export type CalendarEventChangeFailReason = 'invalid' | 'overlap' | 'readonly' | 'policy';

export type CalendarPolicySource = 'event' | 'resource' | 'view';

export interface CalendarValidateEventChangeInfo {
  action: CalendarEventChangeAction;
  view: ViewType;
  event: EventObject;
  previousEvent?: EventObjectWithDefaultValues;
}

export interface CalendarEventChangeFailedInfo {
  reason: CalendarEventChangeFailReason;
  policySource?: CalendarPolicySource;
  action: CalendarEventChangeAction;
  event: EventObject;
  previousEvent?: EventObjectWithDefaultValues;
}

export interface CalendarEventDeleteInfo {
  event: EventObjectWithDefaultValues;
  /**
   * 仅当事件为 recurrence 展开实例时存在。
   *
   * 携带父事件 ID 和原始发生日期，宿主可据此选择删除作用域
   * （本次 / 本次及以后 / 全部）。
   */
  recurrenceInstance?: CalendarRecurrenceInstanceInfo;
}

export interface CalendarExternalDropInfo {
  /**
   * HTML5 路径：外部拖拽携带的原始 DataTransfer 对象
   *
   * 仅在 HTML5 Drag and Drop API 驱动时存在。
   * 编程式 drop（`CalendarInstance.externalDrop`）时为 undefined。
   */
  dataTransfer?: DataTransfer;
  /**
   * 编程式 drop：宿主自定义数据
   *
   * 仅在通过 `CalendarInstance.externalDrop()` 调用时存在。
   * 类型为 `unknown`，宿主自行断言。
   */
  data?: unknown;
  /** drop 位置对应的日期 */
  date: DayjsTZDate;
  /** drop 位置对应的开始时间 */
  start: DayjsTZDate;
  /** drop 位置对应的结束时间（start + 一个时间格） */
  end: DayjsTZDate;
  /** drop 位置对应的资源 ID */
  resourceId?: string;
  /** drop 位置对应的资源名称 */
  resourceName?: string;
}

export type CalendarExternalDropFailReason = 'invalid' | 'policy';

export type CalendarExternalDropPolicySource = 'resource' | 'view';

export interface CalendarExternalDropFailedInfo {
  reason: CalendarExternalDropFailReason;
  policySource?: CalendarExternalDropPolicySource;
  /**
   * HTML5 路径：外部拖拽携带的原始 DataTransfer 对象
   *
   * 仅在 HTML5 Drag and Drop API 驱动时存在。
   */
  dataTransfer?: DataTransfer;
  /**
   * 编程式 drop：宿主自定义数据
   *
   * 仅在通过 `CalendarInstance.externalDrop()` 调用时存在。
   */
  data?: unknown;
  date: DayjsTZDate;
  start: DayjsTZDate;
  end: DayjsTZDate;
  resourceId?: string;
}

export interface CalendarCrossInstanceDragEndInfo {
  /** 被拖出容器的事件数据 */
  event: EventObjectWithDefaultValues;
}

export interface CalendarCrossInstanceDropInfo {
  /**
   * 从源实例拖出的事件数据。
   *
   * 注意：`event.start` / `event.end` 保留的是源实例中的原始时间值，
   * 不代表事件在目标实例中的最终位置。
   * 目标侧应使用本接口的顶层 `start` / `end` 字段作为事件的新时间。
   */
  event: EventObject;
  /** drop 位置对应的日期 */
  date: DayjsTZDate;
  /** drop 位置对应的开始时间（目标实例计算值） */
  start: DayjsTZDate;
  /** drop 位置对应的结束时间（目标实例计算值） */
  end: DayjsTZDate;
  /** drop 位置对应的资源 ID */
  resourceId?: string;
  /** drop 位置对应的资源名称 */
  resourceName?: string;
}

/** 资源显隐切换时传出的信息 */
export interface CalendarResourceVisibilityChangeInfo {
  /** 被切换的资源 id */
  resourceId: string;
  /** 切换后该资源是否可见 */
  visible: boolean;
  /**
   * 切换后的完整可见资源 id 集合。
   *
   * 宿主应据此回写 `scheduler.visibleResourceIds`（受控模式）：
   * 本库不维护独立显隐 state，列表是否生效以回写后的 prop 为准。
   */
  visibleResourceIds: string[];
}

/** 月视图「+N 更多」按钮点击时传出的信息 */
export interface CalendarMoreEventsClickInfo {
  /** 被点击的日期 */
  date: DayjsTZDate;
  /** 该日所有事件（含可见与溢出） */
  events: EventObject[];
}

/** 列表视图当前可见日期变化时传出的信息 */
export interface CalendarAgendaVisibleDateChangeInfo {
  /** 当前列表顶部对应的日期 */
  date: DayjsTZDate;
}

export interface CalendarCallbacks {
  onEventClick?: (info: CalendarEventClickInfo) => void;
  onCellClick?: (info: CalendarCellClickInfo) => void;
  onEventHover?: (info: CalendarEventHoverInfo) => void;
  onPageChange?: (info: CalendarPageChangeInfo) => void;
  onRangeSelect?: (info: CalendarRangeSelectInfo) => void;
  onEventCreate?: (info: CalendarEventCreateInfo) => void;
  onEventUpdate?: (info: CalendarEventUpdateInfo) => void;
  onEventCreateFailed?: (info: CalendarEventChangeFailedInfo) => void;
  onEventUpdateFailed?: (info: CalendarEventChangeFailedInfo) => void;
  onEventDelete?: (info: CalendarEventDeleteInfo) => void;
  onValidateEventChange?: (info: CalendarValidateEventChangeInfo) => boolean;
  onExternalDrop?: (info: CalendarExternalDropInfo) => void;
  onExternalDropFailed?: (info: CalendarExternalDropFailedInfo) => void;
  onCrossInstanceDragEnd?: (info: CalendarCrossInstanceDragEndInfo) => void;
  onCrossInstanceDrop?: (info: CalendarCrossInstanceDropInfo) => void;
  /** 月视图「+N 更多」按钮被点击时触发 */
  onMoreEventsClick?: (info: CalendarMoreEventsClickInfo) => void;
  /** 列表视图滚动导致顶部可见日期变化时触发 */
  onAgendaVisibleDateChange?: (info: CalendarAgendaVisibleDateChangeInfo) => void;
  /**
   * scheduler 资源列头显隐控件被切换时触发。
   *
   * 受控模式：本库只派发意图，宿主据 `info.visibleResourceIds`
   * 回写 `scheduler.visibleResourceIds` 后视图才更新。
   */
  onResourceVisibilityChange?: (info: CalendarResourceVisibilityChangeInfo) => void;
}
