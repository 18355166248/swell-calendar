import { CellBarType } from '@/constants/grid.const';
import { useThemeStore } from '@/contexts/themeStore';
import { cls } from '@/helpers/css';
import { isWeekend } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';

import CellHeader from './CellHeader';

interface GridCellProps {
  date: DayjsTZDate;
  style: React.CSSProperties;
}

const GridCell = ({ date, style }: GridCellProps) => {
  const weekBackgroundColor = useThemeStore((theme) => theme.week.weekend.backgroundColor);
  return (
    <div
      className={cls('day-grid-month-cell')}
      style={{
        ...style,
        backgroundColor: isWeekend(date.getDate()) ? weekBackgroundColor : 'inherit',
      }}
    >
      <span className={cls('day-grid-month-cell-date')}>
        <CellHeader type={CellBarType.header} date={date} />
      </span>
    </div>
  );
};

export default GridCell;
