import { isNil } from 'lodash-es';

import { useTimeGridEventMove } from '@/hooks/TimeGrid/useTimeGridEventMove';
import { EventUIModel } from '@/model/eventUIModel';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';

import { TimeEvent } from '../events/TimeEvent';
import { DragTimeTooltip } from '../scheduler/DragTimeTooltip';

interface MovingEventShadowProps {
  timeGridData: TimeGridData;
  gridPositionFinder: GridPositionFinder;
  events: EventUIModel[];
}

function MovingEventShadow(props: MovingEventShadowProps) {
  const { events, gridPositionFinder, timeGridData } = props;
  const { movingEvent, nextStartTime, nextEndTime } = useTimeGridEventMove({
    gridPositionFinder,
    timeGridData,
    existingEvents: events,
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
