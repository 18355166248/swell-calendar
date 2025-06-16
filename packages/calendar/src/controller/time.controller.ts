import DayjsTZDate from '@/time/dayjs-tzdate';
import { limit, ratio } from '@/utils/math';

export function getTopPercentByTime(date: DayjsTZDate, start: DayjsTZDate, end: DayjsTZDate) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const time = limit(date.getTime(), [startTime], [endTime]) - startTime;
  const max = endTime - startTime;

  const topPercent = ratio(max, 100, time);

  return limit(topPercent, [0], [100]);
}
