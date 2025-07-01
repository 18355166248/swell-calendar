import type { OptionsSlice, WeekOptions } from './options.type';
import { ViewSlice } from './view.type';
import { TemplateSlice } from './template.type';
import { OptionsSlice as LayoutSlice } from './layout.type';
import { DndSlice } from './dnd.type';
import { GridSelectionSlice } from './gridSelection.type';

export type CalendarWeekOptions = Required<WeekOptions>;

export type CalendarState = OptionsSlice &
  ViewSlice &
  TemplateSlice &
  LayoutSlice &
  DndSlice &
  GridSelectionSlice;

export type CalendarStore = CalendarState;
