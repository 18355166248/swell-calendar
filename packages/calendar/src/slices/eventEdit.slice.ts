import { EventEditSlice } from '@/types/eventEdit.type';
import { CalendarStore } from '@/types/store.type';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createEventEditSlice() {
  return (set: SetState): EventEditSlice => ({
    eventEdit: {
      editingEventId: null,
      setEditingEventId: (id) =>
        set((state) => ({ eventEdit: { ...state.eventEdit, editingEventId: id } })),
    },
  });
}
