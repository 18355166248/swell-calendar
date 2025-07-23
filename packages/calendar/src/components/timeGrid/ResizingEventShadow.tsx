import { GridPositionFinder, TimeGridData } from '@/types/grid.type';
import { isNil } from 'lodash-es';
import { TimeEvent } from '../events/TimeEvent';
import { useTimeGridEventResize } from '@/hooks/TimeGrid/useTimeGridEventResize';
import { EventUIModel } from '@/model/eventUIModel';

export interface ResizingEventShadowProps {
  totalUIModels: EventUIModel[][];
  timeGridData: TimeGridData;
  gridPositionFinder: GridPositionFinder;
  columnIndex: number;
}

function ResizingEventShadow(props: ResizingEventShadowProps) {
  const { gridPositionFinder, timeGridData, columnIndex, totalUIModels } = props;
  const { resizingEvent } = useTimeGridEventResize({
    gridPositionFinder,
    timeGridData,
    columnIndex,
    totalUIModels,
  });

  if (isNil(resizingEvent)) {
    return null;
  }

  return <TimeEvent uiModel={resizingEvent} />;
}

export default ResizingEventShadow;
