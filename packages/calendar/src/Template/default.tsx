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
    const { start, end, title } = model;
    // 跨天分段角色（由 TimeEvent 按列日期注入）：
    //   start  → 起始列，显示开始时间
    //   end    → 结束列，显示结束时间
    //   middle → 中间整天列，显示「全天」
    //   undefined → 单日事件，按原行内格式「开始时间 标题」
    const segmentRole = (model as { segmentRole?: 'start' | 'middle' | 'end' }).segmentRole;

    // 单日事件：保持原行内格式
    if (!segmentRole) {
      if (!start) {
        return <span>{stripTags(title)}</span>;
      }
      return (
        <span>
          <strong>{start.dayjs.format('HH:mm')}</strong>&nbsp;
          <span>{stripTags(title)}</span>
        </span>
      );
    }

    // 跨天分段：两行布局——第一行标题，第二行时间/全天。
    // 起始列→开始时间、结束列→结束时间、中间整天列→「全天」。
    let subLabel: string | null = null;
    if (segmentRole === 'start') {
      subLabel = start ? start.dayjs.format('HH:mm') : null;
    } else if (segmentRole === 'end') {
      subLabel = end ? end.dayjs.format('HH:mm') : null;
    } else {
      subLabel = '全天';
    }

    return (
      <span className={cls('event-time-multiday')}>
        <span className={cls('event-time-multiday-title')}>{stripTags(title)}</span>
        {subLabel ? <strong className={cls('event-time-multiday-sub')}>{subLabel}</strong> : null}
      </span>
    );
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
