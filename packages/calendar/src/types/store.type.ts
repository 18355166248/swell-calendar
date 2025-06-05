import type { OptionsSlice, WeekOptions } from './options.type';
import { ViewSlice } from './view.type';

export type CalendarWeekOptions = Required<WeekOptions>;

export type CalendarState = OptionsSlice & ViewSlice;

export type CalendarStore = CalendarState;
