import { Template, TemplateNow } from '@/types/template.type';
import dayjs from 'dayjs';

export const templates: Template = {
  timeGridDisplayPrimaryTime(props: TemplateNow) {
    const { time } = props;

    return dayjs(time.toDate()).format('HH a');
  },

  timeGridDisplayTime(props: TemplateNow) {
    const { time } = props;

    return dayjs(time.toDate()).format('HH:mm');
  },
};

export type TemplateName = keyof Template;
