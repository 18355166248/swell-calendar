import { useCalendarStore } from '@/contexts/calendarStore';
import { useTimeGridEventMove } from '@/hooks/TimeGrid/useTimeGridEventMove';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';

interface MovingEventShadowProps {
  timeGridData: TimeGridData;
  gridPositionFinder: GridPositionFinder;
}

function MovingEventShadow(
  props: MovingEventShadowProps & {
    gridPositionFinder: GridPositionFinder;
    timeGridData: TimeGridData;
  }
) {
  const { gridPositionFinder, timeGridData } = props;
  const { movingEvent } = useTimeGridEventMove({
    gridPositionFinder,
    timeGridData,
  });
  const { dnd } = useCalendarStore();
  const { draggingEventUIModel } = dnd;

  if (!draggingEventUIModel) return null;

  return <div className="moving-event-shadow">MovingEventShadow</div>;
}

export default MovingEventShadow;
