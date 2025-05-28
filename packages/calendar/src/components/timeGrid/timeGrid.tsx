import { addTimeGridPrefix, className } from '@/constants/timeGrid-const';
import { TimeColumn } from './TimeColumn';

const classNames = {
  timeGrid: className,
  scrollArea: addTimeGridPrefix('scroll-area'),
};

export function TimeGrid() {
  return (
    <div className={classNames.timeGrid}>
      <div className={classNames.scrollArea}>
        {/* 时间轴 */}
        <TimeColumn />
      </div>
    </div>
  );
}
