import { cls } from '@/helpers/css';
import { TimeGridRow } from '@/types/grid.type';

interface GridLinesProps {
  timeGridRows: TimeGridRow[];
}

export function GridLines({ timeGridRows }: GridLinesProps) {
  console.log('🚀 ~ timeGridRows:', timeGridRows);
  return <div className={cls('grid-lines')}></div>;
}

export default GridLines;
