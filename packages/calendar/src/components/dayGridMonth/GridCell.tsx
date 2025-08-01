import { cls } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';

interface GridCellProps {
  date: DayjsTZDate;
  style: React.CSSProperties;
}

const GridCell = ({ date, style }: GridCellProps) => {
  return (
    <div className={cls('day-grid-month-cell')} style={style}>
      <span className={cls('day-grid-month-cell-date')}>{date.format('DD')}</span>
    </div>
  );
};

export default GridCell;
