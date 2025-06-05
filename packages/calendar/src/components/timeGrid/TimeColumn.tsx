import { useThemeStore } from '@/contexts/themeStore';
import { addTimeGridPrefix } from '@/constants/timeGrid-const';
import { TimeGridRow } from '@/types/grid.type';
import { memo } from 'react';

interface TimeColumnProps {
  timeGridRows: TimeGridRow[];
}

function TimeColumn({ timeGridRows }: TimeColumnProps) {
  const { week } = useThemeStore();
  const { timeGridLeft } = week;
  const { width } = timeGridLeft;

  const classNames = {
    timeColumn: addTimeGridPrefix('time-column'),
    timeColumnHeader: addTimeGridPrefix('time-column-header'),
    timeColumnHeaderItem: addTimeGridPrefix('time-column-header-item'),
  };

  return (
    <div className={classNames.timeColumn} style={{ width }}>
      <div className={classNames.timeColumnHeader}>
        <div className={classNames.timeColumnHeaderItem}>TimeColumn Test</div>
      </div>
    </div>
  );
}

export default memo(TimeColumn);
