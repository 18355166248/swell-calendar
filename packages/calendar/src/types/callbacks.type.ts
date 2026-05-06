import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from './events.type';
import { ViewType } from './options.type';

export interface CalendarPageChangeInfo {
  view: ViewType;
  date: DayjsTZDate;
}

export interface CalendarEventClickInfo {
  event: EventObjectWithDefaultValues;
}

export interface CalendarCallbacks {
  onEventClick?: (info: CalendarEventClickInfo) => void;
  onPageChange?: (info: CalendarPageChangeInfo) => void;
}
