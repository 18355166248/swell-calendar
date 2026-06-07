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

  return (
    <div className={cls('scheduler-allday-lane')} style={{ display: 'flex', minWidth: 0 }}>
      {/* 左侧 gutter 标签，与下方时间轴 gutter 等宽对齐 */}
      <div
        className={cls('scheduler-allday-lane-label')}
        style={{ width: timeGridLeftWidth, flexShrink: 0 }}
      >
        全天
      </div>
      {/* 全天事件区，与下方日期列对齐（扣除竖向滚动条宽度） */}
      <div
        className={cls('scheduler-allday-lane-content')}
        style={{ flex: 1, minWidth: 0, marginRight: scrollbarWidth }}
      >
        <AlldayRow uiModels={uiModels} />
      </div>
    </div>
  );
}

export { ALLDAY_EVENT_HEIGHT as SCHEDULER_ALLDAY_EVENT_HEIGHT };
