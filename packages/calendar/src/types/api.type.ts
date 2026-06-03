import type { CSSProperties } from 'react';
import { DeepPartial } from 'ts-essentials';

import DayjsTZDate from '@/time/dayjs-tzdate';

import { CalendarInfo } from './calendar.type';
import { CalendarCallbacks } from './callbacks.type';
import { DateType, EventObject, EventObjectWithDefaultValues } from './events.type';
import { Options, ViewType } from './options.type';
import { ThemeState } from './theme.type';
import { NavigateDirection } from './view.type';

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
