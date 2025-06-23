import { cls } from '@/helpers/css';

interface ColumnProps {
  width: string;
}

function Column({ width }: ColumnProps) {
  return (
    <div
      className={cls('column')}
      style={{ width: '100%', backgroundColor: 'rgba(81, 92, 230, 0.05)' }}
    >
      <div className={cls('column-header')}>
        <div className={cls('column-header-date')}></div>
      </div>
    </div>
  );
}

export default Column;
