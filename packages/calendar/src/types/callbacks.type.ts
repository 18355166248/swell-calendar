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
}
