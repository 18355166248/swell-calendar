import { useThemeStore } from '@/contexts/themeStore';
import { cls, toPercent } from '@/helpers/css';
import { TimeGridRow } from '@/types/grid.type';

interface GridLinesProps {
  timeGridRows: TimeGridRow[];
}

export function GridLines({ timeGridRows }: GridLinesProps) {
  const { timeGridHalfHourLine, timeGridHourLine } = useThemeStore((state) => state.week);
  return (
    <div className={cls('grid-lines')}>
      {timeGridRows.map((time, index) => {
        const isUpperLine = index % 2 === 0;
        return (
          <div
            key={index}
            className={cls('grid-line')}
            style={{
              top: toPercent(time.top),
              height: toPercent(time.height),
              borderBottom: isUpperLine
                ? timeGridHalfHourLine.borderBottom
                : timeGridHourLine.borderBottom,
            }}
          />
        );
      })}
    </div>
  );
}

export default GridLines;
