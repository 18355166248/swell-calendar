import { CSSProperties, KeyboardEvent, useMemo } from 'react';

import Layout from '@/components/Layout';
import { KEY } from '@/constants/keyboard';
import { useCalendarCallbacks } from '@/contexts/calendarCallbacks';
import { useCalendarStore } from '@/contexts/calendarStore';
import { AgendaEventItem, getAgendaDayGroups } from '@/controller/agenda.controller';
import { cls, getEventColors } from '@/helpers/css';
import { useCalendarColor } from '@/hooks/calendar/useCalendarColor';
import { useViewportTier } from '@/hooks/common/useViewportTier';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { getTierClassName } from '@/utils/viewport';

import { Template } from '../Template';

function formatDayTitle(date: DayjsTZDate): string {
  return date.dayjs.format('dddd M月D日');
}

function formatEventTimeParts(item: AgendaEventItem): { primary: string; secondary?: string } {
  const { uiModel, isAllday, startsBeforeDay, endsAfterDay } = item;

  if (isAllday) {
    return { primary: '全天' };
  }

  const start = startsBeforeDay ? '' : uiModel.model.start.dayjs.format('HH:mm');
  const end = endsAfterDay ? '' : uiModel.model.end.dayjs.format('HH:mm');

  if (startsBeforeDay && endsAfterDay) {
    return { primary: '全天', secondary: '延续' };
  }
  if (startsBeforeDay) {
    return { primary: end, secondary: '结束' };
  }
  if (endsAfterDay) {
    return { primary: start, secondary: '开始' };
  }

  return { primary: start, secondary: end };
}

function AgendaEventRow({ item }: { item: AgendaEventItem }) {
  const { uiModel } = item;
  const { model } = uiModel;
  const callbacks = useCalendarCallbacks();
  const calendarColor = useCalendarColor(model);
  const colors = getEventColors(uiModel, calendarColor);
  const eventObject = model.toEventObject();
  const timeParts = formatEventTimeParts(item);

  const openEvent = () => callbacks?.onEventClick?.({ event: eventObject });
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === KEY.ENTER || e.key === KEY.SPACE) {
      e.preventDefault();
      openEvent();
    }
  };

  return (
    <button
      type="button"
      className={cls('agenda-event', { 'agenda-event--allday': item.isAllday })}
      style={
        {
          '--swell-agenda-event-bg': colors.backgroundColor,
          '--swell-agenda-event-border': colors.borderColor,
          '--swell-agenda-event-text': colors.color,
        } as CSSProperties & {
          '--swell-agenda-event-bg': string | undefined;
          '--swell-agenda-event-border': string | undefined;
          '--swell-agenda-event-text': string | undefined;
        }
      }
      data-testid={`agenda-event-${model.id}`}
      onClick={openEvent}
      onKeyDown={handleKeyDown}
    >
      <span className={cls('agenda-event-mark')} aria-hidden />
      <span className={cls('agenda-event-main')}>
        <span className={cls('agenda-event-title')}>{model.title || '无标题'}</span>
        <Template template="agendaEventMeta" as="span" param={eventObject} />
      </span>
      <span className={cls('agenda-event-time')}>
        <span>{timeParts.primary}</span>
        {timeParts.secondary ? (
          <span className={cls('agenda-event-time-end')}>{timeParts.secondary}</span>
        ) : null}
      </span>
    </button>
  );
}

export function Agenda() {
  const { options, view } = useCalendarStore();
  const calendar = useCalendarStore((state) => state.calendar);
  const [viewportTier, setViewportRef] = useViewportTier();
  const groups = useMemo(
    () => getAgendaDayGroups(calendar, view.renderDate, options.agenda),
    [calendar, options.agenda, view.renderDate]
  );

  return (
    <Layout className={getTierClassName('agenda-view', viewportTier)} rootRef={setViewportRef}>
      <div className={cls('agenda-scroll')}>
        {groups.map((group) => (
          <section
            key={group.date.dayjs.format('YYYY-MM-DD')}
            className={cls('agenda-day', { 'agenda-day--today': group.isToday })}
          >
            <div className={cls('agenda-day-header')}>
              <span className={cls('agenda-day-title')}>{formatDayTitle(group.date)}</span>
              <span className={cls('agenda-day-count')}>
                <Template
                  template="agendaDayHeader"
                  as="span"
                  param={{
                    date: group.date.getDate(),
                    day: group.date.getDay(),
                    dayName: group.date.dayjs.format('ddd'),
                    eventCount: group.events.length,
                    isToday: group.isToday,
                    month: group.date.getMonth(),
                    renderDate: group.date.dayjs.format('YYYY-MM-DD'),
                    secondaryLabel: group.events.length ? `${group.events.length}项` : '无日程',
                    ymd: group.date.dayjs.format('YYYYMMDD'),
                    dateInstance: group.date,
                  }}
                />
              </span>
            </div>
            <div className={cls('agenda-day-list')}>
              {group.events.length > 0 ? (
                group.events.map((item) => (
                  <AgendaEventRow
                    key={`${item.uiModel.cid()}-${group.date.getTime()}`}
                    item={item}
                  />
                ))
              ) : (
                <div className={cls('agenda-empty')}>无日程</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}
