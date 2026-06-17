import { HoverSlice } from '@/types/hover.type';
import { CalendarStore } from '@/types/store.type';

type SetState = (fn: (state: CalendarStore) => Partial<CalendarStore>) => void;

export function createHoverSlice() {
  return (set: SetState): HoverSlice => ({
    hover: {
      hoveredEventId: null,
      setHoveredEventId: (id) =>
        set((state) => ({ hover: { ...state.hover, hoveredEventId: id } })),
    },
  });
}
