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

export interface CalendarEventUpdateInfo {
  event: EventObject;
  previousEvent: EventObjectWithDefaultValues;
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
}

export interface CalendarExternalDropInfo {
  /** 外部拖拽携带的原始 DataTransfer 对象 */
  dataTransfer: DataTransfer;
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
  dataTransfer: DataTransfer;
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
}
