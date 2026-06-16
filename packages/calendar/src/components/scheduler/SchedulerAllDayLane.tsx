import { ALLDAY_EVENT_HEIGHT, AlldayRow } from '@/components/dayGrid/AlldayRow';
import { cls } from '@/helpers/css';
import { EventUIModel } from '@/model/eventUIModel';

interface SchedulerAllDayLaneProps {
  scrollbarWidth?: number;
  timeGridLeftWidth: number | string;
  uiModels: EventUIModel[];
  /** 固定列宽（像素），设置后全天事件区使用像素宽度 */
  columnWidth?: number;
  /** 网格总像素宽度，用于全天事件区显式宽度 */
  gridPixelWidth?: number;
}

export function SchedulerAllDayLane({
  scrollbarWidth = 0,
  timeGridLeftWidth,
  uiModels,
  columnWidth,
  gridPixelWidth,
}: SchedulerAllDayLaneProps) {
  if (uiModels.length === 0) {
    return null;
  }

  return (
    <div className={cls('scheduler-allday-lane')} style={{ display: 'flex', minWidth: 0 }}>
      {/* 左侧 gutter 标签，与下方时间轴 gutter 等宽对齐 — 固定列宽模式下 sticky */}
      <div
        className={cls('scheduler-allday-lane-label')}
        style={{
          width: timeGridLeftWidth,
          flexShrink: 0,
          ...(columnWidth ? { position: 'sticky', left: 0, zIndex: 1, background: '#fff' } : {}),
        }}
      >
        全天
      </div>
      {/* 全天事件区，与下方日期列对齐 */}
      <div
        className={cls('scheduler-allday-lane-content')}
        style={
          gridPixelWidth
            ? { width: `${gridPixelWidth}px`, flexShrink: 0 }
            : { flex: 1, minWidth: 0, marginRight: scrollbarWidth }
        }
      >
        <AlldayRow uiModels={uiModels} />
      </div>
    </div>
  );
}

export { ALLDAY_EVENT_HEIGHT as SCHEDULER_ALLDAY_EVENT_HEIGHT };
