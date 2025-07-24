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
  const { guideUIModel } = useTimeGridEventResize({
    gridPositionFinder,
    timeGridData,
    columnIndex,
    totalUIModels,
  });

  if (isNil(guideUIModel)) {
    return null;
  }

  return <TimeEvent uiModel={guideUIModel} isResizingEvent={true} />;
}

export default ResizingEventShadow;
