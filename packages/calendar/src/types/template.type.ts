import DayjsTZDate from '@/time/dayjs-tzdate';
import { ReactElement } from 'react';

export interface TemplateNow {
  time: DayjsTZDate;
  format: string;
}

export type TemplateReturnType = string | ReactElement;

export interface Template {
  timeGridDisplayPrimaryTime: (props: TemplateNow) => TemplateReturnType;
  timeGridDisplayTime: (props: TemplateNow) => TemplateReturnType;
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
