import { useCalendarStore } from '@/contexts/calendarStore';

export function useDrag() {
  const { dnd } = useCalendarStore();
  const { initDrag, setDragging, cancelDrag, endDrag } = dnd;

  return {
    dnd,
  };
}
