import { CalendarStore } from '@/types/store.type';
import { GridSelectionSlice, GridSelectionState } from '@/types/gridSelection.type';
import { produce } from 'immer';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

function initializeGridSelectionOptions(): GridSelectionState {
  const gridSelection: GridSelectionState = {
    dayGridMonth: null,
    dayGridWeek: null,
    timeGrid: null,
    accumulated: {
      dayGridMonth: [],
    },
  };
  return gridSelection;
}

export function createGridSelectionSlice() {
  return (set: SetState): GridSelectionSlice => ({
    gridSelection: {
      ...initializeGridSelectionOptions(),
      clearAll: () => {
        set(
          produce<CalendarStore>((state) => {
            state.gridSelection = { ...state.gridSelection, ...initializeGridSelectionOptions() };
          })
        );
      },
    },
  });
}
