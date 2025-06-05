export enum Day {
  SUN,
  MON,
  TUE,
  WED,
  THU,
  FRI,
  SAT,
}

export const WEEK_DAYS = 7;

export function isWeekend(day: Day): boolean {
  return day === Day.SUN || day === Day.SAT;
}

export function isSunday(day: Day): boolean {
  return day === Day.SUN;
}

export function isSaturday(day: Day): boolean {
  return day === Day.SAT;
}
