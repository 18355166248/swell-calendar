import { describe, expect, it } from 'vitest';

import { createEvents } from '@/controller/event.controller';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';
import { EventObject } from '@/types/events.type';
import Collection from '@/utils/collection';

import { getAgendaDayGroups } from './agenda.controller';

function calendarWith(events: EventObject[]): CalendarData {
  const data: CalendarData = {
    calendars: [],
    events: new Collection((event) => event.cid()),
    idsOfDay: {},
  };
  createEvents(data, events);
  return data;
}

describe('agenda.controller', () => {
  it('groups events by continuous days and keeps empty days by default', () => {
    const groups = getAgendaDayGroups(
      calendarWith([
        {
          id: 'standup',
          title: 'Standup',
          start: '2026-06-22T09:00:00',
          end: '2026-06-22T09:30:00',
        },
        {
          id: 'next-day',
          title: 'Next day',
          start: '2026-06-24T10:00:00',
          end: '2026-06-24T11:00:00',
        },
      ]),
      new DayjsTZDate('2026-06-22T00:00:00'),
      { offset: 0, range: 3, showEmptyDays: true }
    );

    expect(groups.map((group) => group.date.dayjs.format('YYYY-MM-DD'))).toEqual([
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
    ]);
    expect(groups.map((group) => group.events.map((event) => event.uiModel.model.id))).toEqual([
      ['standup'],
      [],
      ['next-day'],
    ]);
  });

  it('supports an offset before renderDate', () => {
    const groups = getAgendaDayGroups(calendarWith([]), new DayjsTZDate('2026-06-22T00:00:00'), {
      offset: -2,
      range: 4,
      showEmptyDays: true,
    });

    expect(groups.map((group) => group.date.dayjs.format('YYYY-MM-DD'))).toEqual([
      '2026-06-20',
      '2026-06-21',
      '2026-06-22',
      '2026-06-23',
    ]);
  });

  it('sorts allday first, then start time ascending and longer same-start events first', () => {
    const [group] = getAgendaDayGroups(
      calendarWith([
        {
          id: 'short',
          title: 'Short',
          start: '2026-06-22T09:00:00',
          end: '2026-06-22T09:30:00',
        },
        {
          id: 'all',
          title: 'All day',
          category: 'allday',
          start: '2026-06-22',
          end: '2026-06-22',
        },
        {
          id: 'long',
          title: 'Long',
          start: '2026-06-22T09:00:00',
          end: '2026-06-22T11:00:00',
        },
        {
          id: 'early',
          title: 'Early',
          start: '2026-06-22T08:00:00',
          end: '2026-06-22T09:00:00',
        },
      ]),
      new DayjsTZDate('2026-06-22T00:00:00'),
      { offset: 0, range: 1, showEmptyDays: true }
    );

    expect(group.events.map((event) => event.uiModel.model.id)).toEqual([
      'all',
      'early',
      'long',
      'short',
    ]);
  });

  it('marks cross-day continuation flags and can hide empty days', () => {
    const groups = getAgendaDayGroups(
      calendarWith([
        {
          id: 'cross',
          title: 'Cross day',
          start: '2026-06-22T22:00:00',
          end: '2026-06-24T08:00:00',
        },
      ]),
      new DayjsTZDate('2026-06-22T00:00:00'),
      { offset: 0, range: 4, showEmptyDays: false }
    );

    expect(groups.map((group) => group.date.dayjs.format('YYYY-MM-DD'))).toEqual([
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
    ]);
    expect(
      groups.map((group) => ({
        startsBeforeDay: group.events[0].startsBeforeDay,
        endsAfterDay: group.events[0].endsAfterDay,
      }))
    ).toEqual([
      { startsBeforeDay: false, endsAfterDay: true },
      { startsBeforeDay: true, endsAfterDay: true },
      { startsBeforeDay: true, endsAfterDay: false },
    ]);
  });
});
