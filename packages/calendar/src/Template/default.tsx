import { Fragment } from 'react';
import {
  Template,
  TemplateMonthDayName,
  TemplateNow,
  TemplateWeekDayName,
} from '@/types/template.type';
import dayjs from 'dayjs';
import { cls } from '@/helpers/css';
import { EventObjectWithDefaultValues } from '@/types/events.type';
import { stripTags } from '@/utils/dom';

export const templates: Template = {
  timeGridDisplayPrimaryTime(props: TemplateNow) {
    const { time } = props;

    // 12:00 AM
    return dayjs(time.toDate()).format('HH a');
  },

  timeGridDisplayTime(props: TemplateNow) {
    const { time } = props;

    return time.dayjs.format('HH:mm');
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

  timeGridNowIndicatorLabel(props: TemplateNow) {
    const { time, format = 'HH:mm' } = props;

    return dayjs(time.toDate()).format(format);
  },

  time(model: EventObjectWithDefaultValues) {
    const { start, title } = model;

    if (start) {
      return (
        <span>
          <strong>{start.dayjs.format('HH:mm')}</strong>&nbsp;
          <span>{stripTags(title)}</span>
        </span>
      );
    }

    return stripTags(title);
  },
};
