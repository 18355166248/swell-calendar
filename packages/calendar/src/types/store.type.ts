import { CalendarSlice } from './calendar.type';
import { DndSlice } from './dnd.type';
import { ExternalDropSlice } from './externalDrop.type';
import { GridSelectionSlice } from './gridSelection.type';
import { HoverSlice } from './hover.type';
import { OptionsSlice as LayoutSlice } from './layout.type';
import type { OptionsSlice, WeekOptions } from './options.type';
import { ResourceSlice } from './resource.type';
import { TemplateSlice } from './template.type';
import { ViewSlice } from './view.type';

export type CalendarWeekOptions = Required<WeekOptions>;

export type CalendarState = OptionsSlice &
  ViewSlice &
  TemplateSlice &
  LayoutSlice &
  DndSlice &
  GridSelectionSlice &
  CalendarSlice &
  ResourceSlice &
  HoverSlice &
  ExternalDropSlice;

export type CalendarStore = CalendarState;
