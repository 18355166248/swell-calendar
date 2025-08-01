import { cls, toPercent } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CellStyle } from '@/types/datetime.type';
import GridCell from './GridCell';

interface GridRowProps {
  week: DayjsTZDate[];

  rowInfo: CellStyle[];
}

const GridRow = ({ week, rowInfo }: GridRowProps) => {
  return (
    <div className={cls('grid-row')}>
      {week.map((date, colIndex) => {
        const dayIndex = date.getDate();
        const { width, left } = rowInfo[colIndex];

        return (
          <GridCell
            key={`day-grid-month-cell-${dayIndex}`}
            date={date}
            style={{
              width: toPercent(width),
              left: toPercent(left),
            }}
          />
        );
      })}
    </div>
  );
};

export default GridRow;
