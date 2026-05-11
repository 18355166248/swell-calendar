import { isNil } from 'lodash-es';

import { useTimeGridEventResize } from '@/hooks/TimeGrid/useTimeGridEventResize';
import { EventUIModel } from '@/model/eventUIModel';
import { GridPositionFinder, TimeGridData } from '@/types/grid.type';

import { TimeEvent } from '../events/TimeEvent';
import { DragTimeTooltip } from '../scheduler/DragTimeTooltip';

export interface ResizingEventShadowProps {
  totalUIModels: EventUIModel[][];
  timeGridData: TimeGridData;
  gridPositionFinder: GridPositionFinder;
  columnIndex: number;
}

function ResizingEventShadow(props: ResizingEventShadowProps) {
  const { gridPositionFinder, timeGridData, columnIndex, totalUIModels } = props;
  const { guideUIModel, nextEndTime, nextStartTime } = useTimeGridEventResize({
    gridPositionFinder,
    timeGridData,
    columnIndex,
    totalUIModels,
  });

  if (isNil(guideUIModel)) {
    return null;
  }

  return (
    <>
      <TimeEvent uiModel={guideUIModel} isResizingEvent={true} />
      <DragTimeTooltip uiModel={guideUIModel} start={nextStartTime} end={nextEndTime} />
    </>
  );
}

export default ResizingEventShadow;
