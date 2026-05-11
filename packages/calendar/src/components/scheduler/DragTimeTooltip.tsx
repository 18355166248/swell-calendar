import { useCalendarStore } from '@/contexts/calendarStore';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';

import { Template } from '../Template';

interface DragTimeTooltipProps {
  end: DayjsTZDate | null;
  start: DayjsTZDate | null;
  uiModel: EventUIModel;
}

export function DragTimeTooltip({ end, start, uiModel }: DragTimeTooltipProps) {
  const { currentView } = useCalendarStore((state) => state.view);
  const { x, y } = useCalendarStore((state) => state.dnd);

  if (currentView !== 'scheduler' || !start || !end || x === null || y === null) {
    return null;
  }

  return (
    <div
      className={cls('scheduler-drag-time-tooltip')}
      style={{
        left: x + 12,
        top: y + 12,
      }}
    >
      <Template
        template="timeMoveGuide"
        param={{
          ...uiModel.model.toEventObject(),
          start,
          end,
        }}
      />
    </div>
  );
}
