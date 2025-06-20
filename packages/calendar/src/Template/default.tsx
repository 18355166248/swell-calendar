import { Fragment } from 'react';
import {
  Template,
  TemplateMonthDayName,
  TemplateNow,
  TemplateWeekDayName,
} from '@/types/template.type';
import dayjs from 'dayjs';
import { cls } from '@/helpers/css';

export const templates: Template = {
  timeGridDisplayPrimaryTime(props: TemplateNow) {
    const { time } = props;

    return dayjs(time.toDate()).format('HH a');
  },

  timeGridDisplayTime(props: TemplateNow) {
    const { time } = props;

    return dayjs(time.toDate()).format('HH:mm');
  },

  weekDayName(model: TemplateWeekDayName) {
    const classDate = cls('day-name__date');
    const className = cls('day-name__name');

    return (
      <Fragment>
        <span className={classDate} style={{ marginRight: 4 }}>
          {model.date}
        </span>
        <span className={className}>{model.dayName}</span>
      </Fragment>
    );
  },

  monthDayName(model: TemplateMonthDayName) {
    return model.label;
  },
};
