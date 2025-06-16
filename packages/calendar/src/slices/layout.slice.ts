import { OptionsSlice, WeekViewLayoutSlice } from '@/types/layout.type';
import { CalendarStore } from '@/types/store.type';
import { produce } from 'immer';

function initializeLayoutOptions(): Pick<WeekViewLayoutSlice, 'layout' | 'weekViewLayout'> {
  return {
    layout: 500,
    weekViewLayout: {
      lastPanelType: null,
      dayGridRows: {},
    },
  };
}

function getRestPanelHeight(
  dayGridRows: Record<string, { height: number }>,
  type: string,
  layout: number
) {
  const totalHeight = Object.keys(dayGridRows).reduce((acc, rowName) => {
    if (rowName !== type) {
      acc += dayGridRows[rowName].height;
    }

    return acc;
  }, 0);

  return layout - totalHeight;
}

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createLayoutSlice() {
  return (set: SetState): OptionsSlice => ({
    layout: {
      ...initializeLayoutOptions(),
      setLastPanelType: (type) => {
        set(
          produce((state: CalendarStore) => {
            state.layout.weekViewLayout.lastPanelType = type;

            if (type) {
              state.layout.weekViewLayout.dayGridRows[type].height = getRestPanelHeight(
                state.layout.weekViewLayout.dayGridRows,
                type,
                state.layout.layout
              );
            }
          })
        );
      },
      updateLayoutHeight: (num: number) => {
        set(
          produce((state: CalendarStore) => {
            state.layout.layout = num;

            const { lastPanelType } = state.layout.weekViewLayout;

            if (lastPanelType) {
              state.layout.weekViewLayout.dayGridRows[lastPanelType].height = getRestPanelHeight(
                state.layout.weekViewLayout.dayGridRows,
                lastPanelType,
                state.layout.layout
              );
            }
          })
        );
      },
      updateDayGridRowHeight: (row, height) => {
        set(
          produce((state: CalendarStore) => {
            state.layout.weekViewLayout.dayGridRows[row] = {
              height,
            };
          })
        );
      },
    },
  });
}
