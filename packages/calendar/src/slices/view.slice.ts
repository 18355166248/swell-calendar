import { produce } from 'immer';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { ViewType } from '@/types/options.type';
import { NavigateDirection, ViewSlice } from '@/types/view.type';
import { CalendarStore } from '@/types/store.type';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createViewSlice(initialView: ViewType = 'week') {
  return (set: SetState): ViewSlice => ({
    view: {
      currentView: initialView,
      renderDate: new DayjsTZDate(),
      setView: (v: ViewType) =>
        set(
          produce((state) => {
            state.view.currentView = v;
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
