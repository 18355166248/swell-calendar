import DayjsTZDate from '@/time/dayjs-tzdate';
import { EventObjectWithDefaultValues } from '@/types/events.type';

/**
 * 构造用于 scheduler 测试的 EventObjectWithDefaultValues
 * 提供合理默认值，支持字段覆盖
 */
export function createPreviousEvent(
  event: Partial<EventObjectWithDefaultValues> = {}
): EventObjectWithDefaultValues {
  return {
    id: 'event-a',
    calendarId: 'calendar-a',
    title: 'Event A',
    start: new DayjsTZDate('2026-05-07T10:00:00'),
    end: new DayjsTZDate('2026-05-07T10:30:00'),
    isAllday: false,
    category: 'time',
    isVisible: true,
    isReadOnly: false,
    editable: true,
    draggable: true,
    resizable: true,
    goingDuration: 0,
    comingDuration: 0,
    raw: null,
    __cid: 1,
    ...event,
  };
}
