import type { OptionsSlice, WeekOptions } from './options.type';
import { ViewSlice } from './view.type';
import { TemplateSlice } from './template.type';
import { OptionsSlice as LayoutSlice } from './layout.type';

export type CalendarWeekOptions = Required<WeekOptions>;

export type CalendarState = OptionsSlice & ViewSlice & TemplateSlice & LayoutSlice;

export type CalendarStore = CalendarState;
