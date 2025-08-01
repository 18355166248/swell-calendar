import { cls, toPercent } from '@/helpers/css';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CellStyle } from '@/types/datetime.type';
import GridRow from './GridRow';

interface DayGridMonthProps {
  dateMatrix: DayjsTZDate[][];
  rowInfo: CellStyle[];
  cellWidthMap: number[][];
}

const DayGridMonth = ({ dateMatrix, rowInfo, cellWidthMap }: DayGridMonthProps) => {
  console.log(
    '🚀 ~ DayGridMonth ~ dateMatrix, rowInfo, cellWidthMap:',
    dateMatrix,
    rowInfo,
    cellWidthMap
  );

  const height = 100 / dateMatrix.length;

  return (
    <div className={cls('day-grid-month')}>
      {dateMatrix.map((week, rowIndex) => {
        return (
          <div
            className={cls('day-grid-month-row')}
            key={rowIndex}
            style={{ height: toPercent(height) }}
          >
            <div className={cls('week-day')}>
              <GridRow week={week} rowInfo={rowInfo} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DayGridMonth;
