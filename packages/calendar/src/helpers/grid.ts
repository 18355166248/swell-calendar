import type { DayjsTZDateType } from '@/time/dayjs-tzdate.types';
import { TimeGridData } from '@/types/grid';

export function createTimeGridData(
  datesOfWeek: DayjsTZDateType[],
  options: {
    hourStart: number;
    hourEnd: number;
    narrowWeekend?: boolean;
  }
): TimeGridData {
  const columns = getColumnsData(datesOfWeek, options.narrowWeekend ?? false);

  const steps = (options.hourEnd - options.hourStart) * 2;
  const baseHeight = 100 / steps;
  const rows = range(steps).map((step, index) => {
    const isOdd = index % 2 === 1;
    const hour = options.hourStart + Math.floor(step / 2);
    const startTime = `${hour}:${isOdd ? '30' : '00'}`.padStart(5, '0') as FormattedTimeString;
    const endTime = (isOdd ? `${hour + 1}:00` : `${hour}:30`).padStart(
      5,
      '0'
    ) as FormattedTimeString;

    return {
      top: baseHeight * index,
      height: baseHeight,
      startTime,
      endTime,
    };
  });

  return {
    columns,
    rows,
  };
}
