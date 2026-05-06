import type { CSSProperties } from 'react';
import { CalendarInfo } from './calendar.type';
import { CalendarCallbacks } from './callbacks.type';
import { EventObject, EventObjectWithDefaultValues, DateType } from './events.type';
import { Options, ViewType } from './options.type';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { NavigateDirection } from './view.type';
import { DeepPartial } from 'ts-essentials';
import { ThemeState } from './theme.type';

export interface CalendarInstance {
  getDate: () => DayjsTZDate;
  setDate: (date: DateType) => void;
  setView: (view: ViewType) => void;
  navigate: (direction: NavigateDirection) => void;
  goToToday: () => void;
  setEvents: (events: EventObject[]) => void;
  getEvents: () => EventObjectWithDefaultValues[];
}

export interface EventCalendarProps {
  events?: EventObject[];
  calendars?: CalendarInfo[];
  options?: Options;
  theme?: DeepPartial<ThemeState>;
  callbacks?: CalendarCallbacks;
  className?: string;
  style?: CSSProperties;
}
