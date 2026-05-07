import { ALLDAY_EVENT_HEIGHT, AlldayRow } from '@/components/dayGrid/AlldayRow';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';

interface SchedulerAllDayLaneProps {
  scrollbarWidth?: number;
  timeGridLeftWidth: number | string;
  uiModels: EventUIModel[];
}

export function SchedulerAllDayLane({
  scrollbarWidth = 0,
  timeGridLeftWidth,
  uiModels,
}: SchedulerAllDayLaneProps) {
  if (uiModels.length === 0) {
    return null;
  }

  const rightOffset = scrollbarWidth > 0 ? ` - ${scrollbarWidth}px` : '';

  return (
    <div
      className={cls('scheduler-allday-lane')}
      style={{
        marginLeft: timeGridLeftWidth,
        width: `calc(100% - ${timeGridLeftWidth}${rightOffset})`,
        minWidth: 0,
      }}
    >
      <AlldayRow uiModels={uiModels} />
    </div>
  );
}

export { ALLDAY_EVENT_HEIGHT as SCHEDULER_ALLDAY_EVENT_HEIGHT };
