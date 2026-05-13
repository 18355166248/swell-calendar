import { ReactElement } from 'react';

import DayjsTZDate from '@/time/dayjs-tzdate';

import { EventObjectWithDefaultValues, TimeUnit } from './events.type';

export interface TemplateNow {
  unit: TimeUnit;
  time: DayjsTZDate;
  format: string;
}

export type TemplateReturnType = string | ReactElement;

export interface Template {
  timeGridDisplayPrimaryTime: (props: TemplateNow) => TemplateReturnType;
  timeGridDisplayTime: (props: TemplateNow) => TemplateReturnType;
  weekDayName: (model: TemplateWeekDayName) => TemplateReturnType;
  monthDayName: (model: TemplateMonthDayName) => string;
  timeGridNowIndicatorLabel: (props: TemplateNow) => TemplateReturnType;
  time: (event: EventObjectWithDefaultValues) => TemplateReturnType;
  schedulerTime: (event: EventObjectWithDefaultValues) => TemplateReturnType;
  timeMove: (event: EventObjectWithDefaultValues) => TemplateReturnType;
  timeMoveGuide: (event: EventObjectWithDefaultValues) => TemplateReturnType;
  monthGridHeader: (model: TemplateMonthGrid) => TemplateReturnType;
  schedulerDayHeader: (model: TemplateSchedulerDayHeader) => TemplateReturnType;
  schedulerResourceHeader: (model: TemplateSchedulerResourceHeader) => TemplateReturnType;
}

export type TemplateConfig = Partial<Template>;

export type TemplateSlice = { template: Template };

export interface TemplateWeekDayName {
  date: number;
  day: number;
  dayName: string;
  isToday: boolean;
  renderDate: string;
  dateInstance: DayjsTZDate;
}

export interface TemplateMonthDayName {
  day: number;
  label: string;
}

export type TemplateName = keyof Template;

export interface TemplateMonthGrid {
  date: string;
  day: number;
  hiddenEventCount: number;
  isOtherMonth: boolean;
  isToday: boolean;
  month: number;
  ymd: string;
}

export interface TemplateSchedulerDayHeader {
  date: number;
  day: number;
  dayName: string;
  month: number;
  isToday: boolean;
  dateInstance: DayjsTZDate;
}

export interface TemplateSchedulerResourceHeader {
  resourceId: string;
  resourceName: string;
  resourceColor?: string;
  resourceBackgroundColor?: string;
  resourceMeta?: Record<string, unknown>;
  dateInstance: DayjsTZDate;
  dateIndex: number;
  resourceIndex: number;
  isLastResourceOfDay: boolean;
}
