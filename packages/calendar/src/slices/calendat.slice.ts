import { CalendarStore } from '@/types/store.type';
import { CalendarInfo, CalendarSlice } from '@/types/calendar.type';
import { produce } from 'immer';
import { createEventCollection, createEvents } from '@/controller/event.controller';
import { EventModel } from '@/model/eventModel';

function initializeCalendarOptions(calendars: CalendarInfo[]) {
  return {
    calendars,
    events: createEventCollection<EventModel>(),
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
    },
  });
}
