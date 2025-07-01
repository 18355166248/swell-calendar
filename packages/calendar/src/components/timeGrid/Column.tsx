import { cls } from '@/helpers/css';
import { TimeGridData } from '@/types/grid.type';
import { GridSelectionByColumn } from './GridSelectionByColumn';

interface ColumnProps {
  width: string;
  columnIndex: number;
  timeGridData: TimeGridData;
}

function Column({ width, columnIndex, timeGridData }: ColumnProps) {
  return (
    <div
      className={cls('column')}
      style={{ width: '100%', backgroundColor: 'rgba(81, 92, 230, 0.05)' }}
    >
      <GridSelectionByColumn columnIndex={columnIndex} timeGridRows={timeGridData.rows} />
    </div>
  );
}

export default Column;
