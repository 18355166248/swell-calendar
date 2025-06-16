import { addTimeGridPrefix, className } from '@/constants/timeGrid-const';
import TimeColumn from './TimeColumn';
import { TimeGridData } from '@/types/grid.type';
import { cls } from '@/helpers/css';

const classNames = {
  timeGrid: cls(className),
  scrollArea: cls(addTimeGridPrefix('scroll-area')),
};

export interface TimeGridProps {
  timeGridData: TimeGridData;
}

export function TimeGrid({ timeGridData }: TimeGridProps) {
  return (
    <div className={classNames.timeGrid}>
      <div className={classNames.scrollArea}>
        {/* 时间轴 */}
        <TimeColumn timeGridRows={timeGridData.rows} />
      </div>
    </div>
  );
}
