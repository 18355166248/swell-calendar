import { isWeekend, toStartOfDay } from '@/time/datetime';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { NavigateDirection } from '@/types/view.type';

export function normalizeRange(range?: number): number | undefined {
  if (!Number.isFinite(range)) {
    return undefined;
  }

  const normalized = Math.floor(range as number);
  return normalized > 0 ? normalized : undefined;
}

function skipInvisibleDate(date: DayjsTZDate, direction: 1 | -1, workweek: boolean) {
  if (!workweek) {
    return date;
  }

  let cursor = toStartOfDay(date);
  while (isWeekend(cursor.getDay())) {
    cursor = cursor.addDate(direction);
  }

  return cursor;
}

export function getVisibleDateWindow(
  startDate: DayjsTZDate,
  range: number,
  workweek = false
): DayjsTZDate[] {
  const normalizedRange = normalizeRange(range);
  if (!normalizedRange) {
    return [];
  }

  const result: DayjsTZDate[] = [];
  let cursor = skipInvisibleDate(toStartOfDay(startDate), 1, workweek);

  while (result.length < normalizedRange) {
    if (!workweek || !isWeekend(cursor.getDay())) {
      result.push(cursor);
    }
    cursor = cursor.addDate(1);
  }

  return result;
}

export function getShiftedDateWindowStart(
  startDate: DayjsTZDate,
  range: number,
  direction: NavigateDirection,
  workweek = false
): DayjsTZDate {
  const visibleDates = getVisibleDateWindow(startDate, range, workweek);
  if (visibleDates.length === 0) {
    return toStartOfDay(startDate);
  }

  if (direction === 'next') {
    return visibleDates[visibleDates.length - 1].addDate(1);
  }

  let cursor = visibleDates[0].addDate(-1);
  const previousDates: DayjsTZDate[] = [];
  while (previousDates.length < visibleDates.length) {
    if (!workweek || !isWeekend(cursor.getDay())) {
      previousDates.push(cursor);
    }
    cursor = cursor.addDate(-1);
  }

  return previousDates[previousDates.length - 1];
}

export function formatDateWindowText(days: DayjsTZDate[]): string {
  if (days.length === 0) {
    return '';
  }

  const start = days[0].dayjs;
  const end = days[days.length - 1].dayjs;

  if (days.length === 1 || start.isSame(end, 'day')) {
    return start.format('YYYY年M月D日');
  }

  if (start.isSame(end, 'month')) {
    return `${start.format('YYYY年M月D日')} - ${end.format('D日')}`;
  }

  if (start.isSame(end, 'year')) {
    return `${start.format('YYYY年M月D日')} - ${end.format('M月D日')}`;
  }

  return `${start.format('YYYY年M月D日')} - ${end.format('YYYY年M月D日')}`;
}
