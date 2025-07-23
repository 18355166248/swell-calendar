import { useTimeGridEventMove } from '@/hooks/TimeGrid/useTimeGridEventMove';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { isNil } from 'lodash-es';
import { TimeEvent } from '../events/TimeEvent';

interface MovingEventShadowProps {
  timeGridData: TimeGridData;
  gridPositionFinder: GridPositionFinder;
}

function MovingEventShadow(props: MovingEventShadowProps) {
  const { gridPositionFinder, timeGridData } = props;
  const { movingEvent, nextStartTime, nextEndTime } = useTimeGridEventMove({
    gridPositionFinder,
    timeGridData,
  });

  if (isNil(movingEvent)) {
    return null;
  }

  return (
    <TimeEvent uiModel={movingEvent} nextStartTime={nextStartTime} nextEndTime={nextEndTime} />
  );
}

export default MovingEventShadow;
