import { isNil } from 'lodash-es';

import { useTimeGridEventMove } from '@/hooks/TimeGrid/useTimeGridEventMove';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';

import { TimeEvent } from '../events/TimeEvent';
import { DragTimeTooltip } from '../scheduler/DragTimeTooltip';

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
    <>
      <TimeEvent uiModel={movingEvent} nextStartTime={nextStartTime} nextEndTime={nextEndTime} />
      <DragTimeTooltip uiModel={movingEvent} start={nextStartTime} end={nextEndTime} />
    </>
  );
}

export default MovingEventShadow;
