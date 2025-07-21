import { useCalendarStore } from '@/contexts/calendarStore';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { CalendarState } from '@/types/store.type';

const initXSelector = (state: CalendarState) => state.dnd.initX;
const initYSelector = (state: CalendarState) => state.dnd.initY;

export function useTimeGridEventMove({
  gridPositionFinder,
  timeGridData,
}: {
  gridPositionFinder: GridPositionFinder;
  timeGridData: TimeGridData;
}) {
  const initX = useCalendarStore(initXSelector);
  const initY = useCalendarStore(initYSelector);

  console.log('initX', initX);
  console.log('initY', initY);

  return {
    movingEvent: null,
  };
}
