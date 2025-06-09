import { OptionsSlice, WeekViewLayoutSlice } from '@/types/layout.type';
import { CalendarStore } from '@/types/store.type';

function initializeLayoutOptions(): Pick<WeekViewLayoutSlice, 'layout' | 'weekViewLayout'> {
  return {
    layout: 500,
    weekViewLayout: {
      lastPanelType: null,
      dayGridRows: {},
    },
  };
}

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createLayoutSlice() {
  return (set: SetState): OptionsSlice => ({
    layout: {
      ...initializeLayoutOptions(),
      updateLayoutHeight: (layout: number) => {
        set((state) => ({
          layout: {
            ...state.layout,
            layout: layout,
          },
        }));
      },
      updateDayGridRowHeight: (row, height) => {
        set((state) => {
          state.layout.weekViewLayout.dayGridRows[row] = {
            height,
          };

          return state;
        });
      },
    },
  });
}
