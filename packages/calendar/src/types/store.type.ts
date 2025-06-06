import type { OptionsSlice, WeekOptions } from './options.type';
import { ViewSlice } from './view.type';
import { TemplateSlice } from './template.type';

export type CalendarWeekOptions = Required<WeekOptions>;

export type CalendarState = OptionsSlice & ViewSlice & TemplateSlice;

export type CalendarStore = CalendarState;
