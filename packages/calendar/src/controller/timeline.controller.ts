import { EventUIModel } from '@/model/eventUIModel';
import DayjsTZDate from '@/time/dayjs-tzdate';
import { CalendarData } from '@/types/calendar.type';

import { convertToUIModel, getEventInDateRangeFilter } from './core.controller';

/**
 * 获取时间线视图的事件 UI 模型列表，计算事件在压缩时间轴中的位置。
 *
 * 时间线每天仅显示 hourStart ~ hourEnd 时段（如 08:00~18:00），
 * 非显示时段被压缩。定位时需将实际日期时间映射到压缩后的线性时间轴。
 */
export function getTimelineEvents(
  calendar: CalendarData,
  resourceId: string,
  weekStart: DayjsTZDate,
  weekEnd: DayjsTZDate,
  hourStart: number,
  hourEnd: number
): EventUIModel[] {
  const hoursPerDay = hourEnd - hourStart;
  const totalDays = weekEnd.dayjs.diff(weekStart.dayjs, 'day') + 1;
  const totalHours = totalDays * hoursPerDay;

  const dateFilter = getEventInDateRangeFilter(weekStart, weekEnd);

  const filtered = calendar.events.filter(
    (event) => dateFilter(event) && event.resourceId === resourceId
  );

  const uiModels = convertToUIModel(filtered).toArray();
  const weekStartDayjs = weekStart.dayjs.startOf('day');

  uiModels.forEach((uiModel) => {
    const start = uiModel.getStarts();
    const end = uiModel.getEnds();

    // 计算事件起止日相对于 weekStart 的天数偏移
    const startDayOffset = start.dayjs.startOf('day').diff(weekStartDayjs, 'day');
    const endDayOffset = end.dayjs.startOf('day').diff(weekStartDayjs, 'day');

    // 小时转为小数（9:30 → 9.5）
    const startHour = start.dayjs.hour() + start.dayjs.minute() / 60;
    const endHour = end.dayjs.hour() + end.dayjs.minute() / 60;

    // 判断是否超出可视时间范围
    const exceedsLeft = startDayOffset < 0 || (startDayOffset === 0 && startHour < hourStart);
    const exceedsRight =
      endDayOffset >= totalDays || (endDayOffset === totalDays - 1 && endHour > hourEnd);

    // 在压缩时间轴中计算起止位置（以 displayed-hours 为单位）
    let startPos: number;
    if (startDayOffset < 0) {
      startPos = 0;
    } else if (startDayOffset >= totalDays) {
      startPos = totalHours;
    } else {
      const clampedStartHour = Math.max(startHour, hourStart);
      startPos = startDayOffset * hoursPerDay + (clampedStartHour - hourStart);
    }

    let endPos: number;
    if (endDayOffset < 0) {
      endPos = 0;
    } else if (endDayOffset >= totalDays) {
      endPos = totalHours;
    } else {
      const clampedEndHour = Math.min(endHour, hourEnd);
      endPos = endDayOffset * hoursPerDay + (clampedEndHour - hourStart);
    }

    uiModel.left = (Math.max(startPos, 0) / totalHours) * 100;
    uiModel.width = Math.max(
      ((Math.min(endPos, totalHours) - Math.max(startPos, 0)) / totalHours) * 100,
      0.5
    );
    uiModel.exceedLeft = exceedsLeft;
    uiModel.exceedRight = exceedsRight;
  });

  return uiModels;
}
