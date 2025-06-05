import { addTimeGridPrefix, className } from '@/constants/timeGrid-const';
import TimeColumn from './TimeColumn';
import { TimeGridData } from '@/types/grid.type';

const classNames = {
  timeGrid: className,
  scrollArea: addTimeGridPrefix('scroll-area'),
};

export interface TimeGridProps {
  timeGridData: TimeGridData;
}

export function TimeGrid({ timeGridData }: TimeGridProps) {
  console.log('🚀 ~ TimeGrid ~ timeGridData:', timeGridData);
  return (
    <div className={classNames.timeGrid}>
      <div className={classNames.scrollArea}>
        {/* 时间轴 */}
        <TimeColumn timeGridRows={timeGridData.rows} />
      </div>
    </div>
  );
}
