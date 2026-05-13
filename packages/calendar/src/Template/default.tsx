import dayjs from 'dayjs';
import { Fragment } from 'react';

import { cls } from '@/helpers/css';
import { EventObjectWithDefaultValues } from '@/types/events.type';
import {
  Template,
  TemplateMonthDayName,
  TemplateMonthGrid,
  TemplateNow,
  TemplateSchedulerDayHeader,
  TemplateSchedulerResourceHeader,
  TemplateWeekDayName,
} from '@/types/template.type';
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

  schedulerTime(model: EventObjectWithDefaultValues) {
    return templates.time(model);
  },

  timeMove(model: EventObjectWithDefaultValues) {
    const { start, end, title } = model;

    if (start) {
      return (
        <span>
          <strong>{start.dayjs.format('HH:mm')}</strong>
          <span> - </span>
          <strong>{end.dayjs.format('HH:mm')}</strong>&nbsp;
          <span>{stripTags(title)}</span>
        </span>
      );
    }

    return stripTags(title);
  },

  timeMoveGuide(model: EventObjectWithDefaultValues) {
    return `${model.start.dayjs.format('HH:mm')} - ${model.end.dayjs.format('HH:mm')}`;
  },

  monthGridHeader(model: TemplateMonthGrid) {
    const date = parseInt(model.date.split('-')[2], 10);
    const classNames = cls('weekday-grid-date', { 'weekday-grid-date-decorator': model.isToday });

    return <span className={classNames}>{date}</span>;
  },

  schedulerDayHeader(model: TemplateSchedulerDayHeader) {
    return (
      <span>
        {model.month}/{model.date} 周{model.dayName}
      </span>
    );
  },

  schedulerResourceHeader(model: TemplateSchedulerResourceHeader) {
    return (
      <>
        <span
          className={cls('scheduler-header-resource-dot')}
          style={{
            backgroundColor: model.resourceBackgroundColor || model.resourceColor || '#3b82f6',
          }}
        />
        <span className={cls('scheduler-header-resource-name')}>{model.resourceName}</span>
      </>
    );
  },
};
