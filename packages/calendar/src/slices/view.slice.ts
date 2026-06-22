import { produce } from 'immer';

import DayjsTZDate from '@/time/dayjs-tzdate';
import { getShiftedDateWindowStart, normalizeRange } from '@/time/view-range';
import { Options, ViewType } from '@/types/options.type';
import { CalendarStore } from '@/types/store.type';
import { NavigateDirection, ViewSlice } from '@/types/view.type';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createViewSlice(
  initialView: ViewType = 'week',
  initialDate?: Options['initialDate']
) {
  return (set: SetState): ViewSlice => ({
    view: {
      currentView: initialView,
      renderDate: new DayjsTZDate(initialDate ?? Date.now()),
      setView: (v: ViewType) =>
        set(
          produce((state) => {
            state.view.currentView = v;
          })
        ),
      setDate: (date) =>
        set(
          produce((state) => {
            state.view.renderDate = new DayjsTZDate(date);
          })
        ),
      navigate: (direction: NavigateDirection) =>
        set(
          produce((state) => {
            const step = direction === 'next' ? 1 : -1;
            const view = state.view.currentView;
            if (view === 'day') {
              state.view.renderDate = state.view.renderDate.addDate(step);
            } else if (view === 'month') {
              state.view.renderDate = state.view.renderDate.addMonth(step);
            } else if (view === 'multiDay') {
              const multiDayRange = normalizeRange(state.options.multiDay.range) ?? 2;
              state.view.renderDate = getShiftedDateWindowStart(
                state.view.renderDate,
                multiDayRange,
                direction,
                state.options.week.workweek
              );
            } else if (view === 'agenda') {
              const agendaRange = normalizeRange(state.options.agenda.range) ?? 14;
              state.view.renderDate = getShiftedDateWindowStart(
                state.view.renderDate,
                agendaRange,
                direction
              );
            } else if (view === 'timeline') {
              const timelineRange = normalizeRange(state.options.timeline?.range);
              if (timelineRange) {
                state.view.renderDate = getShiftedDateWindowStart(
                  state.view.renderDate,
                  timelineRange,
                  direction
                );
              } else {
                state.view.renderDate = state.view.renderDate.addMonth(step);
              }
            } else if (view === 'scheduler') {
              const schedulerRange = normalizeRange(state.options.scheduler?.range);
              if (schedulerRange) {
                state.view.renderDate = getShiftedDateWindowStart(
                  state.view.renderDate,
                  schedulerRange,
                  direction,
                  state.options.scheduler?.workweek ?? state.options.week.workweek
                );
              } else {
                state.view.renderDate = state.view.renderDate.addDate(step * 7);
              }
            } else {
              state.view.renderDate = state.view.renderDate.addDate(step * 7);
            }
          })
        ),
      goToToday: () =>
        set(
          produce((state) => {
            state.view.renderDate = new DayjsTZDate();
          })
        ),
    },
  });
}
