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
  const { x, y } = useCalendarStore((state) => state.dnd);

  // 在所有时间网格视图（day / week / scheduler）拖拽时都显示时间范围提示。
  // 该组件只在 TimeGrid 的移动/缩放阴影里挂载，故无需再按视图类型门控。
  if (!start || !end || x === null || y === null) {
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
