import { produce } from 'immer';

import {
  applyOptimisticEventUpdate,
  createEventCollection,
  createEvents,
} from '@/controller/event.controller';
import { EventModel } from '@/model/eventModel';
import { CalendarInfo, CalendarSlice } from '@/types/calendar.type';
import { CalendarStore } from '@/types/store.type';

function initializeCalendarOptions(calendars: CalendarInfo[]) {
  return {
    calendars,
    events: createEventCollection<EventModel>(),
    idsOfDay: {},
  };
}

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createCalendarSlice(calendars: CalendarInfo[] = []) {
  return (set: SetState): CalendarSlice => ({
    calendar: {
      ...initializeCalendarOptions(calendars),
      /**
       * 初始化拖拽操作
       * 设置初始坐标和拖拽类型，并将状态设置为 INIT
       */
      createEvents: (events) => {
        set(
          produce((state: CalendarStore) => {
            createEvents(state.calendar, events);
          })
        );
      },
      setEvents: (events) => {
        set(
          produce((state: CalendarStore) => {
            state.calendar.events = createEventCollection<EventModel>();
            state.calendar.idsOfDay = {};
            createEvents(state.calendar, events);
          })
        );
      },
      updateEvent: (updated) => {
        set(
          produce((state: CalendarStore) => {
            applyOptimisticEventUpdate(state.calendar, updated);
          })
        );
      },
    },
  });
}
