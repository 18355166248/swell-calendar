import { useThemeStore } from '@/contexts/themeStore';
import { addTimeGridPrefix } from '@/constants/timeGrid-const';

export function TimeColumn() {
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
