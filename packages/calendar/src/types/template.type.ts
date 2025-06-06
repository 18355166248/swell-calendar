import DayjsTZDate from '@/time/dayjs-tzdate';
import { ReactElement, ReactNode } from 'react';

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
